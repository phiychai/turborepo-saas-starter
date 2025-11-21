import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';

import app from '@adonisjs/core/services/app';
import logger from '@adonisjs/core/services/logger';

import { UserProfileDTOBuilder, type UserProfileDTO } from '../dto/user_profile_dto.js';

import type { BetterAuthInstance } from '#types/better_auth';
import type { HttpContext } from '@adonisjs/core/http';
import type { UserPreferences } from '@turborepo-saas-starter/shared-types';

import * as abilities from '#abilities/main';
import { auth } from '#config/better_auth';
import User from '#models/user';
import UserPolicy from '#policies/user_policy';
import { EmailSyncService } from '#services/email_sync_service';
import { toWebRequest } from '#utils/better_auth_helpers';
import { updateProfileValidator } from '#validators/auth_validator';

export default class UserController {
  /**
   * @me
   * @summary Get current user profile
   * @description Retrieves the current authenticated user's profile, merged from AdonisJS and Better Auth data. Returns complete user information including preferences, role, and session details.
   * @tag User
   * @response 200 - User profile retrieved successfully
   * @response 401 - Unauthorized - Authentication required
   */
  async me({ auth, betterAuthUser, betterAuthSession, response }: HttpContext): Promise<void> {
    // Build DTO from Adonis User and Better Auth data
    const profile: UserProfileDTO = UserProfileDTOBuilder.build(
      auth.user!,
      betterAuthUser ?? null,
      betterAuthSession ?? null
    );

    return response.json(profile);
  }

  /**
   * @updateProfile
   * @summary Update current user profile
   * @description Updates the current authenticated user's profile information. Supports partial updates - only provided fields will be updated. Email changes are synced to Better Auth and Directus. Username changes are validated by Better Auth.
   * @tag User
   * @requestBody {object} body - Profile update data
   * @requestBody {string} body.firstName - User's first name (optional, 1-100 characters)
   * @requestBody {string} body.lastName - User's last name (optional, 1-100 characters)
   * @requestBody {string} body.fullName - User's full name (optional, 2-100 characters)
   * @requestBody {string} body.email - User's email address (optional, must be unique)
   * @requestBody {string} body.username - User's username (optional, validated by Better Auth)
   * @requestBody {string} body.avatarUrl - URL to user's avatar image (optional)
   * @requestBody {string} body.bio - User's biography (optional, max 500 characters)
   * @requestBody {object} body.preferences - User preferences object (optional)
   * @requestBody {boolean} body.preferences.emailNotifications - Email notification preference
   * @requestBody {boolean} body.preferences.marketingEmails - Marketing email preference
   * @requestBody {string} body.preferences.language - Preferred language
   * @requestBody {string} body.preferences.timezone - User's timezone
   * @requestBody {string} body.preferences.theme - UI theme preference (light, dark, system)
   * @response 200 - Profile updated successfully
   * @response 400 - Validation error - Invalid input data
   * @response 401 - Unauthorized - Authentication required
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
        // Note: Email changes should go through Better Auth's email change flow for verification
        // This endpoint allows email updates in Adonis, but Better Auth email should be updated separately
        // For now, we update Adonis email and sync to Directus
        // Better Auth email should be updated via Better Auth's email change API which includes verification
        await EmailSyncService.syncEmailToAdonisAndDirectus(user, data.email);
      }
      if (data.avatarUrl !== undefined) {
        user.avatarUrl = data.avatarUrl;
      }
      if ('bio' in requestBody || data.bio !== undefined) {
        // Get original value from request body (might be empty string)
        const originalBio = 'bio' in requestBody ? requestBody.bio : undefined;
        user.bio =
          originalBio === '' || originalBio === undefined
            ? null
            : typeof originalBio === 'string'
              ? originalBio
              : data.bio || null;
      }
      // Handle username updates via Better Auth API
      // Better Auth handles validation, uniqueness, and normalization
      if ('username' in requestBody || data.username !== undefined) {
        const originalUsername = 'username' in requestBody ? requestBody.username : undefined;
        const newUsername =
          originalUsername === '' || originalUsername === undefined
            ? null
            : typeof originalUsername === 'string'
              ? originalUsername
              : data.username || null;

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
                (typeof error === 'object' &&
                error !== null &&
                'error' in error &&
                typeof (error as { error?: { message?: string } }).error?.message === 'string'
                  ? (error as { error: { message: string } }).error.message
                  : undefined) ||
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
        // Validator allows unknown properties, but we need to ensure type compatibility
        user.preferences = data.preferences as UserPreferences | null;
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
   * @index
   * @summary List all users
   * @description Retrieves a list of all users in the system. Admin only endpoint. Returns basic user information including email, name, username, role, and active status.
   * @tag User
   * @response 200 - List of users retrieved successfully
   * @response 401 - Unauthorized - Authentication required
   * @response 403 - Forbidden - Admin access required
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
   * @uploadAvatar
   * @summary Upload user avatar
   * @description Uploads an avatar image for the current authenticated user. Accepts JPG, JPEG, PNG, or GIF files up to 1MB. The file is saved to the uploads/avatars directory and a public URL is returned.
   * @tag User
   * @requestBody {file} avatar - Avatar image file (required, max 1MB, formats: jpg, jpeg, png, gif)
   * @response 200 - Avatar uploaded successfully
   * @response 400 - Invalid file or no file provided
   * @response 401 - Unauthorized - Authentication required
   * @response 500 - Server error during upload
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
   * @toggleStatus
   * @summary Toggle user active status
   * @description Toggles the active/inactive status of a user. Admin only endpoint. When deactivating a user, their Better Auth account is also banned.
   * @tag User
   * @paramPath {string} id - User ID (UUID, required)
   * @response 200 - User status toggled successfully
   * @response 401 - Unauthorized - Authentication required
   * @response 403 - Forbidden - Admin access required
   * @response 404 - User not found
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

  /**
   * @getByUsername
   * @summary Get user by username (public)
   * @description Public endpoint to retrieve user information by username. Used for username resolution in spaces and public profiles. Only returns active users.
   * @tag Public
   * @paramPath {string} username - Username to lookup
   * @response 200 - User found and returned
   * @response 400 - Username is required
   * @response 404 - User not found or inactive
   * @response 500 - Server error
   */
  async getByUsername({ params, response }: HttpContext) {
    const { username } = params;

    if (!username) {
      return response.badRequest({ message: 'Username is required' });
    }

    try {
      const user = await User.findBy('username', username);

      if (!user || !user.isActive) {
        return response.notFound({ message: 'User not found' });
      }

      // Return public profile info
      return response.ok({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        betterAuthUserId: user.betterAuthUserId,
      });
    } catch (error: unknown) {
      logger.error('Failed to fetch user:', error);
      return response.internalServerError({
        message: 'Failed to fetch user',
      });
    }
  }
}
