import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';

import app from '@adonisjs/core/services/app';

import { UserProfileDTOBuilder, type UserProfileDTO } from '../dto/user_profile_dto.js';

import type { HttpContext } from '@adonisjs/core/http';

import * as abilities from '#abilities/main';
import { auth } from '#config/better_auth';
import User from '#models/user';
import UserPolicy from '#policies/user_policy';
import { toWebRequest } from '#utils/better_auth_helpers';
import { updateProfileValidator } from '#validators/auth_validator';
import type { BetterAuthInstance } from '#types/better_auth';

export default class UserController {
  /**
   * Get current user profile (merged from Adonis + Better Auth)
   * GET /api/user/me
   */
  async me({ auth, betterAuthUser, betterAuthSession, response }: HttpContext): Promise<void> {
    // Build DTO from Adonis User and Better Auth data
    const profile: UserProfileDTO = UserProfileDTOBuilder.build(
      auth.user!,
      betterAuthUser,
      betterAuthSession
    );

    return response.json(profile);
  }

  /**
   * Get current user profile (legacy endpoint - kept for backward compatibility)
   */
  async profile({ auth, response }: HttpContext) {
    // User is already authenticated (via middleware)
    // No authorization needed - users can always view their own profile
    const user = auth.user!;
    return response.ok({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  /**
   * Update current user profile
   */
  async updateProfile({ auth: authContext, request, response }: HttpContext) {
    try {
      const user = authContext.user!;

      // Pre-process request data: convert empty strings to undefined for optional fields
      const requestData = request.body();
      if (requestData && typeof requestData === 'object') {
        if ('username' in requestData && requestData.username === '') {
          requestData.username = undefined; // Skip validation for empty username
        }
        if ('bio' in requestData && requestData.bio === '') {
          requestData.bio = undefined; // Skip validation for empty bio
        }
      }

      // User can always update their own profile
      const data = await request.validateUsing(updateProfileValidator, {
        meta: { userId: user.id },
      });

      // Handle name splitting if a single "name" field is provided
      // This is for frontend compatibility where name might come as a single field
      const requestBody = request.body() as Record<string, unknown>;
      if ('name' in requestBody && typeof requestBody.name === 'string' && requestBody.name) {
        const nameParts = requestBody.name.trim().split(/\s+/);
        if (nameParts.length > 0) {
          data.firstName = nameParts[0] || undefined;
          data.lastName = nameParts.slice(1).join(' ') || undefined;
        }
      }

      // Update fields
      if (data.firstName !== undefined) {
        user.firstName = data.firstName;
      }
      if (data.lastName !== undefined) {
        user.lastName = data.lastName;
      }
      if (data.fullName !== undefined) {
        user.fullName = data.fullName;
      }
      if (data.email !== undefined && data.email !== user.email) {
        // Update email in AdonisJS (canonical source)
        user.email = data.email;

        // Note: Better Auth does not allow email updates via updateUser API
        // This is a security feature - emails require verification before changing
        // AdonisJS is the canonical source for email, so we update it here
        // Better Auth will continue using the original email for authentication
        // If email verification is needed, users should use Better Auth's email change flow
        // (which typically requires re-verification of the new email)
      }
      if (data.avatarUrl !== undefined) {
        user.avatarUrl = data.avatarUrl;
      }
      if ('bio' in requestBody || data.bio !== undefined) {
        // Get original value from request body (might be empty string)
        const originalBio = 'bio' in requestBody ? requestBody.bio : undefined;
        user.bio = originalBio === '' || originalBio === undefined ? null : (typeof originalBio === 'string' ? originalBio : data.bio || null);
      }
      // Handle username updates via Better Auth API
      // Better Auth handles validation, uniqueness, and normalization
      if ('username' in requestBody || data.username !== undefined) {
        const originalUsername = 'username' in requestBody ? requestBody.username : undefined;
        const newUsername =
          originalUsername === '' || originalUsername === undefined ? null : (typeof originalUsername === 'string' ? originalUsername : data.username || null);

        // Check if username actually changed
        const usernameChanged = newUsername !== user.username;

        if (usernameChanged) {
          // If user has Better Auth account, sync to Better Auth first
          if (user.betterAuthUserId && newUsername) {
            try {
              // Use Better Auth's API directly
              const webRequest = await toWebRequest(request);

              // Call Better Auth's updateUser API
              await (auth as BetterAuthInstance).api?.updateUser?.({
                body: {
                  name: user.fullName || user.email,
                  image: user.avatarUrl || undefined,
                },
                headers: webRequest.headers,
              });

              // Update username in AdonisJS (Better Auth doesn't return username in updateUser response)
              user.username = newUsername;
            } catch (error: unknown) {
              // Better Auth API throws errors directly
              console.error('Error updating username in Better Auth:', error);
              const errorMessage =
                (error instanceof Error && error.message) ||
                (typeof error === 'object' && error !== null && 'error' in error && typeof (error as { error?: { message?: string } }).error?.message === 'string' ? (error as { error: { message: string } }).error.message : undefined) ||
                'Failed to update username';
              throw new Error(`Username update failed: ${errorMessage}`);
            }
          } else {
            // No Better Auth user ID or setting to null - just update AdonisJS
            user.username = newUsername;
          }
        }
        // If username didn't change, don't update (already correct)
      }
      if (data.preferences !== undefined) {
        user.preferences = data.preferences;
      }

      await user.save();

      return response.ok({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          username: user.username,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          role: user.role,
        },
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'messages' in error) {
        return response.badRequest({
          message: 'Validation failed',
          errors: (error as { messages: unknown }).messages,
        });
      }
      throw error;
    }
  }

  /**
   * List all users (admin only)
   */
  async index({ auth, response }: HttpContext) {
    // Check if user can view user list
    await abilities.viewUsers.execute(auth.user!);

    const users = await User.query()
      .select('id', 'email', 'firstName', 'lastName', 'username', 'role', 'isActive', 'createdAt')
      .orderBy('createdAt', 'desc');

    return response.ok({
      users,
    });
  }

  /**
   * Upload avatar image
   * POST /api/user/avatar
   */
  async uploadAvatar({ auth: authContext, request, response }: HttpContext) {
    try {
      const user = authContext.user!;
      const avatarFile = request.file('avatar', {
        size: '1mb',
        extnames: ['jpg', 'jpeg', 'png', 'gif'],
      });

      if (!avatarFile) {
        return response.badRequest({
          message: 'No avatar file provided',
        });
      }

      if (!avatarFile.isValid) {
        return response.badRequest({
          message: 'Invalid avatar file',
          errors: avatarFile.errors,
        });
      }

      // Generate unique filename
      const fileExtension = avatarFile.extname || 'jpg';
      const uniqueFilename = `${user.id}-${randomBytes(16).toString('hex')}.${fileExtension}`;

      // Create avatars directory if it doesn't exist
      const avatarsDir = app.publicPath('uploads/avatars');
      await mkdir(avatarsDir, { recursive: true });

      // Save file
      await avatarFile.move(avatarsDir, {
        name: uniqueFilename,
        overwrite: true,
      });

      // Generate public URL
      // In production, this should use your CDN or storage service URL
      const avatarUrl = `/uploads/avatars/${uniqueFilename}`;

      // Update user's avatar URL
      user.avatarUrl = avatarUrl;
      await user.save();

      return response.ok({
        message: 'Avatar uploaded successfully',
        avatarUrl,
      });
    } catch (error: unknown) {
      console.error('Avatar upload error:', error);
      return response.internalServerError({
        message: 'Failed to upload avatar',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Toggle user status (admin only)
   */
  async toggleStatus({ bouncer, params, response }: HttpContext) {
    const targetUser = await User.findOrFail(params.id);

    // Check if user can toggle status using policy
    // authorize method: user is already set on bouncer, so we only pass action and remaining args
    await bouncer.with(UserPolicy).authorize('toggleStatus', targetUser);

    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();

    return response.ok({
      message: `User ${targetUser.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        isActive: targetUser.isActive,
      },
    });
  }
}
