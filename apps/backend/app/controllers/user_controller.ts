import type { HttpContext } from "@adonisjs/core/http";
import User from "#models/user";
import { updateProfileValidator } from "#validators/auth_validator";
import { bouncer } from "@adonisjs/bouncer";
import * as abilities from "#abilities/main";
import UserPolicy from "#policies/user_policy";

export default class UserController {
  /**
   * Get current user profile
   */
  async profile({ auth, response }: HttpContext) {
    // User is already authenticated (via middleware)
    // No authorization needed - users can always view their own profile
    return response.ok({
      id: auth.user.id,
      email: auth.user.email,
      firstName: auth.user.firstName,
      lastName: auth.user.lastName,
      username: auth.user.username,
      avatarUrl: auth.user.avatarUrl,
      fullName: auth.user.fullName,
      role: auth.user.role,
      isActive: auth.user.isActive,
      preferences: auth.user.preferences,
      createdAt: auth.user.createdAt,
      updatedAt: auth.user.updatedAt,
    });
  }

  /**
   * Update current user profile
   */
  async updateProfile({ auth, request, response }: HttpContext) {
    try {
      // User can always update their own profile
      const data = await request.validateUsing(updateProfileValidator, {
        meta: { userId: auth.user.id },
      });

      // Update fields
      if (data.firstName !== undefined) {
        auth.user.firstName = data.firstName;
      }
      if (data.lastName !== undefined) {
        auth.user.lastName = data.lastName;
      }
      if (data.fullName !== undefined) {
        auth.user.fullName = data.fullName;
      }
      if (data.email !== undefined) {
        auth.user.email = data.email;
      }
      if (data.avatarUrl !== undefined) {
        auth.user.avatarUrl = data.avatarUrl;
      }
      if (data.preferences !== undefined) {
        auth.user.preferences = data.preferences;
      }

      await auth.user.save();

      return response.ok({
        message: "Profile updated successfully",
        user: {
          id: auth.user.id,
          email: auth.user.email,
          firstName: auth.user.firstName,
          lastName: auth.user.lastName,
          fullName: auth.user.fullName,
          role: auth.user.role,
        },
      });
    } catch (error) {
      if (error.messages) {
        return response.badRequest({
          message: "Validation failed",
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
    await abilities.viewUsers(auth.user);

    const users = await User.query()
      .select("id", "email", "firstName", "lastName", "username", "role", "isActive", "createdAt")
      .orderBy("createdAt", "desc");

    return response.ok({
      users,
    });
  }

  /**
   * Toggle user status (admin only)
   */
  async toggleStatus({ auth, params, response }: HttpContext) {
    const targetUser = await User.findOrFail(params.id);

    // Check if user can toggle status using policy
    await bouncer.with(UserPolicy).authorize("toggleStatus", auth.user, targetUser);

    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();

    return response.ok({
      message: `User ${targetUser.isActive ? "activated" : "deactivated"} successfully`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        isActive: targetUser.isActive,
      },
    });
  }
}

