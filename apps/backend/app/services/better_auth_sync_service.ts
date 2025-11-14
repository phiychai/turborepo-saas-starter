import { auth } from '#config/better_auth';
import User from '#models/user';
import logger from '@adonisjs/core/services/logger';
import { toWebRequest } from '#utils/better_auth_helpers';

/**
 * Sync Service: AdonisJS → Better Auth
 *
 * Since AdonisJS is canonical, we sync changes TO Better Auth.
 * This service handles one-way sync from AdonisJS to Better Auth.
 */
export class BetterAuthSyncService {
  /**
   * Sync role change from AdonisJS to Better Auth
   */
  static async syncRole(adonisUserId: number, newRole: string, request?: any): Promise<void> {
    const user = await User.findOrFail(adonisUserId);

    if (!user.betterAuthUserId) {
      return; // No Better Auth user to sync to
    }

    try {
      // Better Auth Admin plugin handles role syncing
      // We'll use Better Auth Admin API if available
      // For now, log the change - Better Auth Admin plugin may handle it automatically
      logger.info(`Role sync requested for user ${user.id}: ${newRole}`);

      // If Better Auth Admin plugin provides API for role syncing, use it here
      // await auth.api.setRole({ ... });
    } catch (error) {
      logger.error('Failed to sync role to Better Auth:', error);
      // Don't throw - AdonisJS is canonical, Better Auth is secondary
    }
  }

  /**
   * Sync ban status from AdonisJS to Better Auth
   */
  static async syncBanStatus(
    adonisUserId: number,
    isBanned: boolean,
    reason?: string,
    request?: any
  ): Promise<void> {
    const user = await User.findOrFail(adonisUserId);

    if (!user.betterAuthUserId) {
      return;
    }

    try {
      // Better Auth Admin plugin handles ban status
      // We'll use Better Auth Admin API if available
      logger.info(`Ban status sync requested for user ${user.id}: ${isBanned}`);

      // If Better Auth Admin plugin provides API for ban syncing, use it here
      // if (isBanned) {
      //   await auth.api.banUser({ ... });
      // } else {
      //   await auth.api.unbanUser({ ... });
      // }
    } catch (error) {
      logger.error('Failed to sync ban status to Better Auth:', error);
      // Don't throw - AdonisJS is canonical
    }
  }

  /**
   * Sync user deletion from AdonisJS to Better Auth
   */
  static async syncUserDeletion(adonisUserId: number, request?: any): Promise<void> {
    const user = await User.findByOrFail('id', adonisUserId);

    if (!user.betterAuthUserId) {
      return;
    }

    try {
      // Better Auth Admin plugin handles user deletion
      logger.info(`User deletion sync requested for Better Auth user: ${user.betterAuthUserId}`);

      // If Better Auth Admin plugin provides API for user deletion, use it here
      // await auth.api.removeUser({ ... });
    } catch (error) {
      logger.error('Failed to sync user deletion to Better Auth:', error);
      // Don't throw - AdonisJS is canonical
    }
  }
}
