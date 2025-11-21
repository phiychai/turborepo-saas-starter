import logger from '@adonisjs/core/services/logger';
import db from '@adonisjs/lucid/services/db';

import type { HttpContext } from '@adonisjs/core/http';

import { auth } from '#config/better_auth';
import { toWebRequest } from '#utils/better_auth_helpers';
import User from '#models/user';

/**
 * Sync Service: AdonisJS → Better Auth
 *
 * Since AdonisJS is canonical, we sync changes TO Better Auth.
 * This service handles one-way sync from AdonisJS to Better Auth.
 */
export class BetterAuthSyncService {
  /**
   * Sync role change from AdonisJS to Better Auth
   * Maps Adonis roles to Better Auth roles:
   * - 'admin' → 'admin' in Better Auth
   * - 'user', 'content_admin', 'editor', 'writer' → 'user' in Better Auth
   */
  static async syncRole(
    adonisUserId: number,
    newRole: string,
    _request?: HttpContext['request']
  ): Promise<void> {
    const user = await User.findOrFail(adonisUserId);

    if (!user.betterAuthUserId) {
      return; // No Better Auth user to sync to
    }

    try {
      // Map Adonis role to Better Auth role
      // Better Auth only needs admin vs non-admin distinction
      const betterAuthRole = newRole === 'admin' ? 'admin' : 'user';

      // Update Better Auth user role directly in database
      // Better Auth stores roles in the 'user' table with a 'role' column
      const dbConnection = db.connection();
      await dbConnection
        .from('user')
        .where('id', user.betterAuthUserId)
        .update({ role: betterAuthRole });

      logger.info(
        `Synced role to Better Auth: Adonis role '${newRole}' → Better Auth role '${betterAuthRole}' for user ${user.id}`
      );
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
    _reason?: string,
    _request?: HttpContext['request']
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
   * Uses Better Auth Admin plugin's removeUser API to delete the user
   */
  static async syncUserDeletion(
    adonisUserId: number,
    request?: HttpContext['request']
  ): Promise<void> {
    const user = await User.findByOrFail('id', adonisUserId);

    if (!user.betterAuthUserId) {
      return;
    }

    try {
      logger.info(`Deleting Better Auth user: ${user.betterAuthUserId}`);

      // Use Better Auth Admin plugin's removeUser API
      if (auth.api?.removeUser && request) {
        const webRequest = await toWebRequest(request);
        await auth.api.removeUser({
          body: {
            userId: user.betterAuthUserId,
          },
          headers: webRequest.headers,
        });
        logger.info(`Successfully deleted Better Auth user: ${user.betterAuthUserId}`);
      } else {
        // Fallback: Delete directly from database if API not available
        const dbConnection = db.connection();
        await dbConnection.from('user').where('id', user.betterAuthUserId).delete();
        logger.info(`Deleted Better Auth user from database: ${user.betterAuthUserId}`);
      }
    } catch (error) {
      logger.error('Failed to sync user deletion to Better Auth:', error);
      // Don't throw - AdonisJS is canonical, but log the error
    }
  }
}
