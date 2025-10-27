import hash from "@adonisjs/core/services/hash";

import type { HttpContext } from "@adonisjs/core/http";

import User from "#models/user";
import BillingService from "#services/billing_service";
import {
  registerValidator,
  loginValidator,
  changePasswordValidator,
} from "#validators/auth_validator";

export default class AuthController {
  /**
   * Register a new user
   */
  async register({ request, response }: HttpContext) {
    try {
      const data = await request.validateUsing(registerValidator);

      const user = await User.create({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: "user",
        isActive: true,
      });

      // Create customer in Lago billing system
      try {
        await BillingService.createCustomer({
          externalId: user.id.toString(),
          name: user.fullName || undefined,
          email: user.email,
          currency: "USD",
          timezone: "UTC",
        });
      } catch (lagoError) {
        // Log error but don't fail registration if Lago is unavailable
        console.error("Failed to create Lago customer:", lagoError);
        // TODO: Consider implementing a retry queue for failed customer creation
      }

      return response.created({
        message: "User registered successfully",
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
   * Login user
   */
  async login({ request, response, auth }: HttpContext) {
    try {
      const { email, password } = await request.validateUsing(loginValidator);

      const user = await User.verifyCredentials(email, password);

      if (!user.isActive) {
        return response.forbidden({
          message: "Your account has been deactivated",
        });
      }

      await auth.use("web").login(user);

      return response.ok({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      if (error.messages) {
        return response.badRequest({
          message: "Validation failed",
          errors: error.messages,
        });
      }

      return response.unauthorized({
        message: "Invalid credentials",
      });
    }
  }

  /**
   * Logout user
   */
  async logout({ response, auth }: HttpContext) {
    await auth.use("web").logout();

    return response.ok({
      message: "Logout successful",
    });
  }

  /**
   * Get current authenticated user
   */
  async me({ response, auth }: HttpContext) {
    try {
      await auth.check();
      const user = auth.user!;

      return response.ok({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      });
    } catch {
      return response.unauthorized({
        message: "Not authenticated",
      });
    }
  }

  /**
   * Change password
   */
  async changePassword({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!;
      const { currentPassword, newPassword } = await request.validateUsing(changePasswordValidator);

      // Verify current password
      const isValid = await hash.verify(user.password, currentPassword);
      if (!isValid) {
        return response.badRequest({
          message: "Current password is incorrect",
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      return response.ok({
        message: "Password changed successfully",
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
}
