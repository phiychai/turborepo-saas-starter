import { UserProfileDTOBuilder, type UserProfileDTO } from '../dto/user_profile_dto.js';

import type { HttpContext } from '@adonisjs/core/http';

import * as abilities from '#abilities/main';
import User from '#models/user';
import UserPolicy from '#policies/user_policy';
import { updateProfileValidator } from '#validators/auth_validator';

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
  async updateProfile({ auth, request, response }: HttpContext) {
    try {
      const user = auth.user!;
      // User can always update their own profile
      const data = await request.validateUsing(updateProfileValidator, {
        meta: { userId: user.id },
      });

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
      if (data.email !== undefined) {
        user.email = data.email;
      }
      if (data.avatarUrl !== undefined) {
        user.avatarUrl = data.avatarUrl;
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
          role: user.role,
        },
      });
    } catch (error) {
      if (error.messages) {
        return response.badRequest({
          message: 'Validation failed',
          errors: error.messages,
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
