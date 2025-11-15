import logger from '@adonisjs/core/services/logger';
import db from '@adonisjs/lucid/services/db';

import { auth } from '#config/better_auth';
import AuthSyncError from '#models/auth_sync_error';
import User from '#models/user';
import { AuthErrorLogger } from '#services/auth_error_logger';
import { UserSyncService } from '#services/user_sync_service';

export class AuthReconciliationService {
  /**
   * Retry failed user syncs
   * Attempts to re-sync Better Auth users to AdonisJS users table
   */
  static async retryFailedSyncs(maxRetries: number = 3): Promise<{
    success: number;
    failed: number;
  }> {
    const errors = await AuthSyncError.query()
      .where('eventType', 'upsert_failed')
      .where('handled', false)
      .where('retryCount', '<', maxRetries)
      .orderBy('createdAt', 'asc')
      .limit(50); // Process in batches

    let success = 0;
    let failed = 0;

    for (const error of errors) {
      try {
        // Get Better Auth user data from error payload
        if (!error.externalUserId) {
          await error.markAsHandled();
          continue;
        }

        // Fetch Better Auth user from Better Auth database
        const betterAuthUser = await this.getBetterAuthUser(error.externalUserId);

        if (!betterAuthUser) {
          await error.incrementRetry();
          failed++;
          continue;
        }

        // Retry sync
        const adonisUser = await UserSyncService.syncUser({
          betterAuthUser,
          provider: error.provider || 'email',
          requestPath: error.requestPath || null,
          clientIp: null, // Don't log IP on retry
        });

        if (adonisUser) {
          await error.markAsHandled();
          success++;
          logger.info(`Reconciled user: ${adonisUser.email}`);
        } else {
          await error.incrementRetry();
          failed++;
        }
      } catch (err: any) {
        logger.error(`Reconciliation retry failed: ${err.message}`);
        await error.incrementRetry();
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Fix missing mappings
   * Attempts to establish mapping between Better Auth users and Adonis users
   */
  static async fixMissingMappings(): Promise<{
    fixed: number;
    failed: number;
  }> {
    const errors = await AuthSyncError.query()
      .where('eventType', 'missing_mapping')
      .where('handled', false)
      .orderBy('createdAt', 'asc')
      .limit(50);

    let fixed = 0;
    let failed = 0;

    for (const error of errors) {
      try {
        if (!error.externalUserId) {
          await error.markAsHandled();
          failed++;
          continue;
        }

        // Try to find Adonis user by better_auth_user_id (shouldn't happen, but just in case)
        let adonisUser = await User.findBy('better_auth_user_id', error.externalUserId);

        // If not found, try to sync from Better Auth
        if (!adonisUser) {
          const betterAuthUser = await this.getBetterAuthUser(error.externalUserId);
          if (betterAuthUser) {
            adonisUser = await UserSyncService.syncUser({
              betterAuthUser,
              provider: error.provider || 'email',
              requestPath: error.requestPath || null,
              clientIp: null,
            });
          }
        }

        if (adonisUser) {
          await error.markAsHandled();
          fixed++;
          logger.info(`Fixed missing mapping: ${adonisUser.email}`);
        } else {
          // Can't fix without user - mark as handled to avoid retrying forever
          await error.markAsHandled();
          failed++;
        }
      } catch (err: any) {
        logger.error(`Failed to fix missing mapping: ${err.message}`);
        await error.incrementRetry();
        failed++;
      }
    }

    return { fixed, failed };
  }

  /**
   * Sync all Better Auth users that don't exist in AdonisJS
   * Useful for syncing users that were created before sync hooks were set up
   */
  static async syncAllMissingUsers(): Promise<{
    synced: number;
    failed: number;
    skipped: number;
  }> {
    try {
      // Get all Better Auth users
      const betterAuthUsers = await db.from('user').select('*');

      let synced = 0;
      let failed = 0;
      let skipped = 0;

      for (const baUser of betterAuthUsers) {
        try {
          // Check if user already exists in AdonisJS
          const existingUser = await User.query()
            .where('better_auth_user_id', baUser.id)
            .orWhere('email', baUser.email)
            .first();

          if (existingUser) {
            skipped++;
            continue;
          }

          // Map Better Auth user format
          const betterAuthUser = {
            id: baUser.id,
            email: baUser.email,
            name: baUser.name || null,
            image: baUser.image || null,
            emailVerified: baUser.emailVerified || false,
            username: baUser.username || null,
          };

          // Sync user
          const adonisUser = await UserSyncService.syncUser({
            betterAuthUser,
            provider: 'email',
            requestPath: null,
            clientIp: null,
          });

          if (adonisUser) {
            synced++;
            logger.info(`Synced missing user: ${adonisUser.email}`);
          } else {
            failed++;
          }
        } catch (err: any) {
          logger.error(`Failed to sync user ${baUser.email}: ${err.message}`);
          failed++;
        }
      }

      return { synced, failed, skipped };
    } catch (err: any) {
      logger.error(`Error syncing all users: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get Better Auth user from Better Auth database
   * Note: Better Auth uses its own database tables
   */
  static async getBetterAuthUser(betterAuthUserId: string): Promise<any | null> {
    try {
      // Better Auth stores users in its own database
      // The table name depends on Better Auth configuration
      // Common table names: 'user', 'users', or configured via Better Auth
      const result = await db
        .from('user') // Better Auth default table name
        .where('id', betterAuthUserId)
        .first();

      if (!result) {
        return null;
      }

      // Map Better Auth user format to what UserSyncService expects
      return {
        id: result.id,
        email: result.email,
        name: result.name || null,
        image: result.image || null,
        emailVerified: result.emailVerified || false,
        username: result.username || null, // If using Username Plugin
      };
    } catch (err: any) {
      logger.error(`Error fetching Better Auth user: ${err.message}`);
      return null;
    }
  }

  /**
   * Get Better Auth user from Better Auth database by email
   */
  static async getBetterAuthUserByEmail(email: string): Promise<any | null> {
    try {
      const result = await db.from('user').where('email', email).first();

      if (!result) {
        return null;
      }

      return {
        id: result.id,
        email: result.email,
        name: result.name || null,
        image: result.image || null,
        emailVerified: result.emailVerified || false,
        username: result.username || null,
      };
    } catch (err: any) {
      logger.error(`Error fetching Better Auth user by email: ${err.message}`);
      return null;
    }
  }

  /**
   * Run full reconciliation
   * Retries failed syncs and fixes missing mappings
   */
  static async runReconciliation(): Promise<{
    syncs: { success: number; failed: number };
    mappings: { fixed: number; failed: number };
  }> {
    logger.info('Starting auth reconciliation...');

    const [syncs, mappings] = await Promise.all([
      this.retryFailedSyncs(),
      this.fixMissingMappings(),
    ]);

    logger.info('Reconciliation complete', { syncs, mappings });

    return { syncs, mappings };
  }
}
