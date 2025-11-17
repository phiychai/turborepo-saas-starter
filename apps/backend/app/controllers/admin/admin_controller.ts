import logger from '@adonisjs/core/services/logger';

import type { HttpContext } from '@adonisjs/core/http';

import * as abilities from '#abilities/main';
import User from '#models/user';
import UserPolicy from '#policies/user_policy';
import { AuthReconciliationService } from '#services/auth_reconciliation_service';
import { BetterAuthSyncService } from '#services/better_auth_sync_service';
import { UserSyncService } from '#services/user_sync_service';

export default class AdminController {
  /**
   * List all users (admin only)
   * GET /api/admin/users
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
   * Get user details (admin only)
   * GET /api/admin/users/:id
   */
  async getUser({ params, response, auth }: HttpContext) {
    await abilities.manageUsers.execute(auth.user!);

    const user = await User.findOrFail(params.id);

    return response.ok({
      user: user.serialize(),
    });
  }

  /**
   * Update user (admin only)
   * PATCH /api/admin/users/:id
   */
  async updateUser({ params, request, response, bouncer }: HttpContext) {
    const targetUser = await User.findOrFail(params.id);
    await bouncer.with(UserPolicy).authorize('update', targetUser);

    const { firstName, lastName, role, isActive } = request.only([
      'firstName',
      'lastName',
      'role',
      'isActive',
    ]);

    // Update in AdonisJS first (canonical)
    if (firstName !== undefined) targetUser.firstName = firstName;
    if (lastName !== undefined) targetUser.lastName = lastName;
    if (role !== undefined) targetUser.role = role as 'user' | 'admin';
    if (isActive !== undefined) targetUser.isActive = isActive;

    await targetUser.save();

    // Sync role change to Better Auth if needed
    if (role !== undefined && targetUser.betterAuthUserId) {
      await BetterAuthSyncService.syncRole(targetUser.id, role, request);
    }

    return response.ok({
      user: targetUser.serialize(),
    });
  }

  /**
   * Delete user (admin only)
   * DELETE /api/admin/users/:id
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
   * Toggle user active status (admin only)
   * PATCH /api/admin/users/:id/toggle-status
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
   * Sync all Better Auth users that are missing from AdonisJS (admin only)
   * POST /api/admin/users/sync-all
   */
  async syncAllUsers({ response, auth }: HttpContext) {
    await abilities.manageUsers.execute(auth.user!);

    try {
      const result = await AuthReconciliationService.syncAllMissingUsers();

      return response.ok({
        message: 'User sync completed',
        ...result,
      });
    } catch (error: any) {
      logger.error('Failed to sync all users:', error);
      return response.internalServerError({
        message: 'Failed to sync users',
        error: error.message,
      });
    }
  }

  /**
   * Sync a specific user by email (admin only)
   * POST /api/admin/users/sync
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
    } catch (error: any) {
      logger.error('Failed to sync user:', error);
      return response.internalServerError({
        message: 'Failed to sync user',
        error: error.message,
      });
    }
  }
}
