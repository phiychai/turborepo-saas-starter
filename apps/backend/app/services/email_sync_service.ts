import logger from '@adonisjs/core/services/logger';

import User from '#models/user';
import { DirectusUserSyncService } from '#services/directus_user_sync_service';

/**
 * Email Sync Service
 *
 * Synchronizes email changes across Better Auth, AdonisJS, and Directus.
 * Email changes should flow from Better Auth → Adonis → Directus (one-way).
 * Better Auth handles email verification, so it should be the source of truth for email.
 */
export class EmailSyncService {
  /**
   * Sync email from Better Auth to Adonis and Directus
   * Called after Better Auth email is verified and updated
   */
  static async syncEmailFromBetterAuth(
    betterAuthUserId: string,
    newEmail: string
  ): Promise<boolean> {
    try {
      // Find Adonis user by Better Auth user ID
      const user = await User.findBy('better_auth_user_id', betterAuthUserId);

      if (!user) {
        logger.warn(`No Adonis user found for Better Auth user ${betterAuthUserId}`);
        return false;
      }

      // Update email in Adonis (canonical)
      user.email = newEmail;
      await user.save();

      // Sync to Directus if user has Directus account
      if (user.directusUserId) {
        await DirectusUserSyncService.updateDirectusUserEmail(user.directusUserId, newEmail);
      }

      logger.info(`Email synced from Better Auth to Adonis and Directus for user ${user.id}`);
      return true;
    } catch (error) {
      logger.error(`Failed to sync email from Better Auth: ${error}`);
      return false;
    }
  }

  /**
   * Sync email to Directus
   * Helper method for updating Directus email when Adonis email changes
   */
  static async syncEmailToDirectus(directusUserId: string, email: string): Promise<boolean> {
    return await DirectusUserSyncService.updateDirectusUserEmail(directusUserId, email);
  }

  /**
   * Sync email to Adonis and Directus
   * Used when email is updated in Adonis (should be rare - email should change via Better Auth)
   * This is a fallback for admin operations or edge cases
   */
  static async syncEmailToAdonisAndDirectus(
    user: User,
    newEmail: string
  ): Promise<{ adonisUpdated: boolean; directusUpdated: boolean }> {
    try {
      // Update Adonis email
      user.email = newEmail;
      await user.save();

      // Sync to Directus if user has Directus account
      let directusUpdated = false;
      if (user.directusUserId) {
        directusUpdated = await DirectusUserSyncService.updateDirectusUserEmail(
          user.directusUserId,
          newEmail
        );
      }

      logger.info(`Email synced to Adonis and Directus for user ${user.id}`);
      return { adonisUpdated: true, directusUpdated };
    } catch (error) {
      logger.error(`Failed to sync email to Adonis and Directus: ${error}`);
      return { adonisUpdated: false, directusUpdated: false };
    }
  }

  /**
   * Note: Better Auth email changes should go through Better Auth's email change flow
   * which includes verification. After Better Auth email is verified, this service
   * should be called to sync to Adonis and Directus.
   *
   * If Better Auth provides email change hooks, they should call syncEmailFromBetterAuth.
   * Otherwise, email changes should be initiated through Better Auth's API/UI.
   */
}
