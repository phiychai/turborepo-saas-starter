import logger from '@adonisjs/core/services/logger';

import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';

import { auth } from '#config/better_auth';
import User from '#models/user';
import { AuthErrorLogger } from '#services/auth_error_logger';
import { UserSyncService } from '#services/user_sync_service';

/**
 * Auth middleware validates Better Auth sessions and loads Adonis User model
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to when authentication fails
   */
  redirectTo = '/login';

  async handle(ctx: HttpContext, next: NextFn) {
    try {
      // Convert AdonisJS request to fetch Request for Better Auth
      const url = new URL(ctx.request.url(), `http://${ctx.request.header('host')}`);

      const fetchRequest = new Request(url, {
        method: ctx.request.method(),
        headers: ctx.request.headers() as HeadersInit,
      });

      // Validate session using Better Auth
      const session = await auth.api.getSession({ headers: fetchRequest.headers });

      if (!session || !session.user) {
        return ctx.response.unauthorized({
          message: 'Unauthorized. Please login to continue.',
        });
      }

      // Find Adonis User by better_auth_user_id
      // This is the primary mapping method (stored in our Adonis users table)
      let adonisUser = await User.findBy('better_auth_user_id', session.user.id);

      // Fallback: If not found by better_auth_user_id, try email lookup
      if (!adonisUser && session.user.email) {
        adonisUser = await User.findBy('email', session.user.email);

        // If found by email, update better_auth_user_id to establish the mapping
        if (adonisUser) {
          adonisUser.betterAuthUserId = session.user.id;
          await adonisUser.save();
        }
      }

      // If still not found, try to sync user (background - don't block request)
      // This ensures Adonis user exists even if hooks didn't fire
      if (!adonisUser) {
        // Attempt to sync user in background
        UserSyncService.syncUser({
          betterAuthUser: session.user,
          provider: null, // Will be determined from account if needed
          requestPath: ctx.request.url(),
          clientIp: ctx.request.ip(),
        })
          .then((syncedUser) => {
            if (syncedUser) {
              logger.info(`Background user sync successful: ${syncedUser.id}`);
            }
          })
          .catch((error) => {
            // Error logged in sync service
            logger.error('Background user sync in middleware failed:', error);
          });

        // Log missing mapping error
        await this.logMissingMapping({
          sessionId: session.session?.id,
          betterAuthUserId: session.user.id,
          email: session.user.email || null,
          requestPath: ctx.request.url(),
          clientIp: ctx.request.ip(),
        });

        return ctx.response.unauthorized({
          message: 'User account not properly configured. Please contact support.',
        });
      }

      // Verify user is active
      if (!adonisUser.isActive) {
        return ctx.response.forbidden({
          message: 'Account is disabled. Please contact support.',
        });
      }

      // Attach Adonis User to context
      ctx.auth = {
        user: adonisUser,
      } as any;

      // Also attach Better Auth user/session for reference (optional)
      ctx.betterAuthUser = session.user;
      ctx.betterAuthSession = session.session;

      return next();
    } catch (error) {
      logger.error('Auth middleware error:', error);
      return ctx.response.unauthorized({
        message: 'Authentication failed',
      });
    }
  }

  /**
   * Log missing mapping error
   */
  private async logMissingMapping(data: {
    sessionId?: string;
    betterAuthUserId: string;
    email: string | null;
    adonisUserId?: number | null;
    requestPath: string;
    clientIp: string;
  }): Promise<void> {
    try {
      await AuthErrorLogger.logError({
        eventType: 'missing_mapping',
        provider: null,
        externalUserId: data.betterAuthUserId,
        email: data.email,
        adonisUserId: data.adonisUserId || null,
        requestPath: data.requestPath,
        clientIp: data.clientIp,
        error: `Missing mapping between Better Auth user (${data.betterAuthUserId}) and Adonis user`,
        payload: {
          sessionId: data.sessionId,
          betterAuthUserId: data.betterAuthUserId,
        },
      });
    } catch (error) {
      logger.error('Failed to log missing mapping error:', error);
    }
  }
}
