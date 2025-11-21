import logger from '@adonisjs/core/services/logger';

import type { HttpContext } from '@adonisjs/core/http';

import * as abilities from '#abilities/main';
import { auth } from '#config/better_auth';
import User from '#models/user';
import UserPolicy from '#policies/user_policy';
import { AuthReconciliationService } from '#services/auth_reconciliation_service';
import { BetterAuthSyncService } from '#services/better_auth_sync_service';
import { DirectusUserSyncService } from '#services/directus_user_sync_service';
import { EmailSyncService } from '#services/email_sync_service';
import { UserSyncService } from '#services/user_sync_service';
import { createUserValidator } from '#validators/admin_validator';

export default class AdminController {
  /**
   * @listUsers
   * @summary List all users (admin)
   * @description Retrieves a paginated list of all users in the system with filtering and search capabilities. Admin only endpoint.
   * @tag Admin
   * @paramQuery {integer} page - Page number (default: 1)
   * @paramQuery {integer} limit - Items per page (default: 25)
   * @paramQuery {string} search - Search term for email, name, or username
   * @paramQuery {string} role - Filter by user role (user, admin, content_admin, editor, writer)
   * @paramQuery {boolean} isActive - Filter by active status (true/false)
   * @response 200 - Users retrieved successfully with pagination metadata
   * @response 401 - Unauthorized - Authentication required
   * @response 403 - Forbidden - Admin access required
   */
  async listUsers({ request, response, auth }: HttpContext) {
    // Check authorization via Bouncer
    await abilities.manageUsers.execute(auth.user!);

    const page = request.input('page', 1);
    const limit = request.input('limit', 25);
    const search = request.input('search', '');
    const role = request.input('role');
    const isActive = request.input('isActive');

    const query = User.query();

    // Search
    if (search) {
      query.where((q) => {
        q.where('email', 'ilike', `%${search}%`)
          .orWhere('first_name', 'ilike', `%${search}%`)
          .orWhere('last_name', 'ilike', `%${search}%`)
          .orWhere('username', 'ilike', `%${search}%`);
      });
    }

    // Filters
    if (role) {
      query.where('role', role);
    }
    if (isActive !== undefined) {
      query.where('isActive', isActive === 'true');
    }

    // Pagination
    const users = await query.orderBy('createdAt', 'desc').paginate(page, limit);

    return response.ok({
      users: users.serialize(),
      pagination: {
        page: users.currentPage,
        perPage: users.perPage,
        total: users.total,
        lastPage: users.lastPage,
      },
    });
  }

  /**
   * @createUser
   * @summary Create new user (admin)
   * @description Creates a new user account in the system. The user is created in Better Auth first, then synced to AdonisJS and Directus (if role requires it). Admin only endpoint.
   * @tag Admin
   * @requestBody {object} body - User creation data
   * @requestBody {string} body.email - User's email address (required, must be unique)
   * @requestBody {string} body.password - User's password (required, minimum 8 characters)
   * @requestBody {string} body.firstName - User's first name (optional, 1-100 characters)
   * @requestBody {string} body.lastName - User's last name (optional, 1-100 characters)
   * @requestBody {string} body.username - User's username (optional, 3-30 characters)
   * @requestBody {string} body.role - User's role (required: user, admin, content_admin, editor, writer)
   * @response 201 - User created successfully
   * @response 400 - Validation error - Invalid input data
   * @response 401 - Unauthorized - Authentication required
   * @response 403 - Forbidden - Admin access required
   * @response 409 - Conflict - User with this email already exists
   * @response 500 - Server error - Failed to create user
   */
  async createUser({ request, response, auth: authContext }: HttpContext) {
    await abilities.manageUsers.execute(authContext.user!);

    try {
      const data = await request.validateUsing(createUserValidator);

      // Check if user already exists
      const existingUser = await User.findBy('email', data.email);
      if (existingUser) {
        return response.conflict({
          message: 'User with this email already exists',
        });
      }

      // Create user in Better Auth first
      let betterAuthUser;
      try {
        if (auth.api.signUpEmail) {
          const result = await auth.api.signUpEmail({
            body: {
              email: data.email,
              password: data.password,
              name:
                data.firstName && data.lastName
                  ? `${data.firstName} ${data.lastName}`.trim()
                  : data.firstName || data.lastName || data.email,
              ...(data.username && { username: data.username }),
            },
          });
          betterAuthUser = result?.user;
        } else {
          return response.internalServerError({
            message: 'Better Auth sign-up API not available',
          });
        }
      } catch (error: unknown) {
        const errorMessage =
          (error instanceof Error && error.message) ||
          (typeof error === 'object' &&
          error !== null &&
          'error' in error &&
          typeof (error as { error?: { message?: string } }).error?.message === 'string'
            ? (error as { error: { message: string } }).error.message
            : undefined) ||
          'Unknown error';
        logger.error('Better Auth sign-up failed:', errorMessage);
        return response.internalServerError({
          message: `Failed to create user in Better Auth: ${errorMessage}`,
        });
      }

      if (!betterAuthUser?.id) {
        return response.internalServerError({
          message: 'Better Auth user creation succeeded but no user ID returned',
        });
      }

      // Sync to Adonis with specified role
      // Wait a bit for Better Auth hook to potentially run, but we'll override the role
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get the user that was created by the hook (if any)
      let adonisUser = await User.findBy('better_auth_user_id', betterAuthUser.id);

      if (adonisUser) {
        // Update role if different from default
        if (adonisUser.role !== data.role) {
          adonisUser.role = data.role;
          await adonisUser.save();
        }
      } else {
        // Create Adonis user manually with specified role
        adonisUser = await UserSyncService.syncUser({
          betterAuthUser: {
            id: betterAuthUser.id,
            email: betterAuthUser.email,
            name: betterAuthUser.name || undefined,
            image: betterAuthUser.image || undefined,
            emailVerified: betterAuthUser.emailVerified,
            username: data.username || undefined,
          },
          provider: 'email',
          role: data.role,
        });
      }

      if (!adonisUser) {
        return response.internalServerError({
          message: 'Failed to create user in AdonisJS',
        });
      }

      // Sync role to Better Auth (map to admin/user)
      if (adonisUser.betterAuthUserId) {
        await BetterAuthSyncService.syncRole(adonisUser.id, data.role, request);
      }

      // If role requires Directus, create Directus user
      if (DirectusUserSyncService.requiresDirectusUser(data.role)) {
        await DirectusUserSyncService.syncUserToDirectus(adonisUser, data.role);
      }

      // Reload user to get Directus user ID if created
      await adonisUser.refresh();

      return response.created({
        message: 'User created successfully',
        user: adonisUser.serialize(),
      });
    } catch (error: unknown) {
      logger.error('Failed to create user:', error);
      return response.internalServerError({
        message: 'Failed to create user',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * @getUser
   * @summary Get user details (admin)
   * @description Retrieves detailed information about a specific user by ID. Admin only endpoint.
   * @tag Admin
   * @paramPath {string} id - User ID (UUID, required)
   * @response 200 - User details retrieved successfully
   * @response 401 - Unauthorized - Authentication required
   * @response 403 - Forbidden - Admin access required
   * @response 404 - User not found
   */
  async getUser({ params, response, auth }: HttpContext) {
    await abilities.manageUsers.execute(auth.user!);

    const user = await User.findOrFail(params.id);

    return response.ok({
      user: user.serialize(),
    });
  }

  /**
   * @updateUser
   * @summary Update user (admin)
   * @description Updates a user's information including name, email, role, and active status. Changes are synced to Better Auth and Directus as needed. Admin only endpoint.
   * @tag Admin
   * @paramPath {string} id - User ID (UUID, required)
   * @requestBody {object} body - User update data (all fields optional)
   * @requestBody {string} body.firstName - User's first name (optional, 1-100 characters)
   * @requestBody {string} body.lastName - User's last name (optional, 1-100 characters)
   * @requestBody {string} body.email - User's email address (optional, must be unique and valid email format)
   * @requestBody {string} body.role - User's role (optional: "user", "admin", "content_admin", "editor", "writer")
   * @requestBody {boolean} body.isActive - User's active status (optional, true/false)
   * @response 200 - User updated successfully
   * @response 401 - Unauthorized - Authentication required
   * @response 403 - Forbidden - Admin access required or insufficient permissions
   * @response 404 - User not found
   */
  async updateUser({ params, request, response, bouncer }: HttpContext) {
    const targetUser = await User.findOrFail(params.id);
    await bouncer.with(UserPolicy).authorize('update', targetUser);

    const { firstName, lastName, email, role, isActive } = request.only([
      'firstName',
      'lastName',
      'email',
      'role',
      'isActive',
    ]);

    const oldRole = targetUser.role;
    const oldEmail = targetUser.email;

    // Update in AdonisJS first (canonical)
    if (firstName !== undefined) targetUser.firstName = firstName;
    if (lastName !== undefined) targetUser.lastName = lastName;
    if (email !== undefined && email !== targetUser.email) {
      // Email change - sync to Directus
      // Note: Better Auth email should be updated via Better Auth's email change flow
      await EmailSyncService.syncEmailToAdonisAndDirectus(targetUser, email);
    }
    if (role !== undefined) {
      targetUser.role = role as 'user' | 'admin' | 'content_admin' | 'editor' | 'writer';
    }
    if (isActive !== undefined) targetUser.isActive = isActive;

    await targetUser.save();

    // Sync role change to Better Auth if needed
    if (role !== undefined && targetUser.betterAuthUserId) {
      await BetterAuthSyncService.syncRole(targetUser.id, role, request);
    }

    // Handle Directus role changes
    if (role !== undefined && oldRole !== role) {
      const requiresDirectus = DirectusUserSyncService.requiresDirectusUser(role);
      const oldRequiresDirectus = DirectusUserSyncService.requiresDirectusUser(oldRole);

      if (requiresDirectus && !oldRequiresDirectus) {
        // Role changed to content role - create Directus user
        await DirectusUserSyncService.syncUserToDirectus(targetUser, role);
      } else if (!requiresDirectus && oldRequiresDirectus) {
        // Role changed from content role to general user - Directus user remains but role updated
        // (We don't delete Directus users, just update their role if they exist)
        if (targetUser.directusUserId) {
          // Update to a general role or leave as is
          // Actually, we should probably leave the Directus user but note they're no longer active
        }
      } else if (requiresDirectus && oldRequiresDirectus) {
        // Role changed between content roles - update Directus role
        if (targetUser.directusUserId) {
          await DirectusUserSyncService.updateDirectusUserRole(targetUser.directusUserId, role);
        } else {
          // Create Directus user if it doesn't exist
          await DirectusUserSyncService.syncUserToDirectus(targetUser, role);
        }
      }
    }

    return response.ok({
      user: targetUser.serialize(),
    });
  }

  /**
   * @deleteUser
   * @summary Delete user (admin)
   * @description Permanently deletes a user from the system. The user is deleted from Better Auth and AdonisJS. Admin only endpoint with additional authorization checks.
   * @tag Admin
   * @paramPath {string} id - User ID (UUID, required)
   * @response 200 - User deleted successfully
   * @response 401 - Unauthorized - Authentication required
   * @response 403 - Forbidden - Admin access required or insufficient permissions
   * @response 404 - User not found
   */
  async deleteUser({ params, request, response, bouncer }: HttpContext) {
    const targetUser = await User.findOrFail(params.id);
    await bouncer.with(UserPolicy).authorize('delete', targetUser);

    // Sync deletion to Better Auth (if Better Auth user exists)
    if (targetUser.betterAuthUserId) {
      await BetterAuthSyncService.syncUserDeletion(targetUser.id, request);
    }

    // Delete from AdonisJS (canonical)
    await targetUser.delete();

    return response.ok({
      message: 'User deleted successfully',
    });
  }

  /**
   * @toggleStatus
   * @summary Toggle user active status (admin)
   * @description Toggles a user's active/inactive status. When deactivating, the user is banned in Better Auth. When reactivating, the ban is removed. Admin only endpoint.
   * @tag Admin
   * @paramPath {string} id - User ID (UUID, required)
   * @response 200 - User status toggled successfully
   * @response 401 - Unauthorized - Authentication required
   * @response 403 - Forbidden - Admin access required or insufficient permissions
   * @response 404 - User not found
   */
  async toggleStatus({ params, request, response, bouncer }: HttpContext) {
    const user = await User.findOrFail(params.id);

    await bouncer.with(UserPolicy).authorize('toggleStatus', user);

    user.isActive = !user.isActive;
    await user.save();

    // If deactivating, sync ban status to Better Auth
    if (!user.isActive && user.betterAuthUserId) {
      await BetterAuthSyncService.syncBanStatus(
        user.id,
        true,
        'User deactivated by admin',
        request
      );
    } else if (user.isActive && user.betterAuthUserId) {
      // If reactivating, unban in Better Auth
      await BetterAuthSyncService.syncBanStatus(user.id, false, undefined, request);
    }

    return response.ok({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: user.serialize(),
    });
  }

  /**
   * @syncAllUsers
   * @summary Sync all missing users (admin)
   * @description Synchronizes all Better Auth users that are missing from AdonisJS. This reconciles the user databases and ensures all Better Auth users have corresponding AdonisJS records. Admin only endpoint.
   * @tag Admin
   * @response 200 - User sync completed with statistics
   * @response 401 - Unauthorized - Authentication required
   * @response 403 - Forbidden - Admin access required
   * @response 500 - Server error - Failed to sync users
   */
  async syncAllUsers({ response, auth }: HttpContext) {
    await abilities.manageUsers.execute(auth.user!);

    try {
      const result = await AuthReconciliationService.syncAllMissingUsers();

      return response.ok({
        message: 'User sync completed',
        ...result,
      });
    } catch (error: unknown) {
      logger.error('Failed to sync all users:', error);
      return response.internalServerError({
        message: 'Failed to sync users',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * @syncUser
   * @summary Sync user by email (admin)
   * @description Synchronizes a specific user from Better Auth to AdonisJS by email address. If the user already exists in AdonisJS, returns the existing user. Admin only endpoint.
   * @tag Admin
   * @requestBody {object} body - Sync request data
   * @requestBody {string} body.email - Email address of the user to sync (required, must be valid email format)
   * @response 200 - User synced successfully or already exists
   * @response 400 - Bad request - Email is required or invalid format
   * @response 401 - Unauthorized - Authentication required
   * @response 403 - Forbidden - Admin access required
   * @response 404 - User not found in Better Auth
   * @response 500 - Server error - Failed to sync user
   */
  async syncUser({ request, response, auth }: HttpContext) {
    await abilities.manageUsers.execute(auth.user!);

    const { email } = request.only(['email']);

    if (!email) {
      return response.badRequest({
        message: 'Email is required',
      });
    }

    try {
      // Check if user already exists in AdonisJS
      const existingUser = await User.findBy('email', email);

      if (existingUser) {
        return response.ok({
          message: 'User already exists in AdonisJS',
          user: existingUser.serialize(),
        });
      }

      // Get Better Auth user by email
      const betterAuthUser = await AuthReconciliationService.getBetterAuthUserByEmail(email);

      if (!betterAuthUser) {
        return response.notFound({
          message: 'User not found in Better Auth',
        });
      }

      // Sync user
      const adonisUser = await UserSyncService.syncUser({
        betterAuthUser,
        provider: 'email',
        requestPath: undefined,
        clientIp: undefined,
      });

      if (!adonisUser) {
        return response.internalServerError({
          message: 'Failed to sync user',
        });
      }

      return response.ok({
        message: 'User synced successfully',
        user: adonisUser.serialize(),
      });
    } catch (error: unknown) {
      logger.error('Failed to sync user:', error);
      return response.internalServerError({
        message: 'Failed to sync user',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
