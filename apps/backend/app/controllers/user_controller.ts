import type { HttpContext } from "@adonisjs/core/http";
import User from "#models/user";
import { updateProfileValidator } from "#validators/auth_validator";

export default class UserController {
  /**
   * Get user profile
   */
  async profile({ response, auth }: HttpContext) {
    const user = auth.user!;

    return response.ok({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }

  /**
   * Update user profile
   */
  async updateProfile({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!;
      const data = await request.validateUsing(updateProfileValidator, {
        meta: { userId: user.id },
      });

      if (data.fullName !== undefined) {
        user.fullName = data.fullName;
      }

      if (data.email !== undefined) {
        user.email = data.email;
      }

      await user.save();

      return response.ok({
        message: "Profile updated successfully",
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
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
   * Get all users (admin only)
   */
  async index({ response, auth }: HttpContext) {
    const currentUser = auth.user!;

    if (currentUser.role !== "admin") {
      return response.forbidden({
        message: "Access denied",
      });
    }

    const users = await User.query().select(
      "id",
      "email",
      "fullName",
      "role",
      "isActive",
      "createdAt"
    );

    return response.ok({
      users,
    });
  }

  /**
   * Toggle user active status (admin only)
   */
  async toggleStatus({ params, response, auth }: HttpContext) {
    const currentUser = auth.user!;

    if (currentUser.role !== "admin") {
      return response.forbidden({
        message: "Access denied",
      });
    }

    const user = await User.findOrFail(params.id);

    if (user.id === currentUser.id) {
      return response.badRequest({
        message: "Cannot deactivate your own account",
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    return response.ok({
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      user: {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
      },
    });
  }
}

