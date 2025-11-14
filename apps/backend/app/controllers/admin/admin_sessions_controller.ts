import type { HttpContext } from '@adonisjs/core/http';

import * as abilities from '#abilities/main';
import { auth } from '#config/better_auth';
import User from '#models/user';
import { toWebRequest } from '#utils/better_auth_helpers';
import logger from '@adonisjs/core/services/logger';
import env from '#start/env';

export default class AdminSessionsController {
  /**
   * List user sessions (Better Auth)
   * GET /api/admin/users/:id/sessions
   */
  async listUserSessions({ params, request, response, auth, bouncer }: HttpContext) {
    await abilities.manageUsers.execute(auth.user!);

    const user = await User.findOrFail(params.id);

    if (!user.betterAuthUserId) {
      return response.badRequest({
        message: 'User not linked to Better Auth',
      });
    }

    // Use Better Auth Admin plugin API
    try {
      const webRequest = await toWebRequest(request);

      // Use Better Auth API method if available
      if (auth.api.listUserSessions) {
        const sessions = await auth.api.listUserSessions({
          body: { userId: user.betterAuthUserId },
          headers: webRequest.headers,
        });

        return response.ok({
          sessions,
        });
      } else {
        // Fallback to handler if API method not available
        const baseURL = env.get('BETTER_AUTH_URL', 'http://localhost:3333');
        const betterAuthRequest = new Request(`${baseURL}/api/auth/admin/list-user-sessions`, {
          method: 'POST',
          headers: webRequest.headers,
          body: JSON.stringify({ userId: user.betterAuthUserId }),
        });

        const betterAuthResponse = await auth.handler(betterAuthRequest);
        const sessions = await betterAuthResponse.json();

        return response.ok({
          sessions,
        });
      }
    } catch (error) {
      logger.error('Failed to list user sessions:', error);
      return response.internalServerError({
        message: 'Failed to list user sessions',
      });
    }
  }

  /**
   * Revoke user session (Better Auth)
   * DELETE /api/admin/sessions/:sessionToken
   */
  async revokeSession({ params, request, response, auth, bouncer }: HttpContext) {
    await abilities.manageUsers.execute(auth.user!);

    try {
      const webRequest = await toWebRequest(request);

      // Use Better Auth API method if available
      if (auth.api.revokeUserSession) {
        await auth.api.revokeUserSession({
          body: { sessionToken: params.sessionToken },
          headers: webRequest.headers,
        });
      } else {
        // Fallback to handler if API method not available
        const baseURL = env.get('BETTER_AUTH_URL', 'http://localhost:3333');
        const betterAuthRequest = new Request(`${baseURL}/api/auth/admin/revoke-session`, {
          method: 'POST',
          headers: webRequest.headers,
          body: JSON.stringify({ sessionToken: params.sessionToken }),
        });

        await auth.handler(betterAuthRequest);
      }

      return response.ok({
        message: 'Session revoked successfully',
      });
    } catch (error) {
      logger.error('Failed to revoke session:', error);
      return response.internalServerError({
        message: 'Failed to revoke session',
      });
    }
  }

  /**
   * Revoke all sessions for user (Better Auth)
   * DELETE /api/admin/users/:id/sessions
   */
  async revokeAllSessions({ params, request, response, auth, bouncer }: HttpContext) {
    await abilities.manageUsers.execute(auth.user!);

    const user = await User.findOrFail(params.id);

    if (!user.betterAuthUserId) {
      return response.badRequest({
        message: 'User not linked to Better Auth',
      });
    }

    try {
      const webRequest = await toWebRequest(request);

      // Use Better Auth API method if available
      if (auth.api.revokeUserSessions) {
        await auth.api.revokeUserSessions({
          body: { userId: user.betterAuthUserId },
          headers: webRequest.headers,
        });
      } else {
        // Fallback to handler if API method not available
        const baseURL = env.get('BETTER_AUTH_URL', 'http://localhost:3333');
        const betterAuthRequest = new Request(`${baseURL}/api/auth/admin/revoke-user-sessions`, {
          method: 'POST',
          headers: webRequest.headers,
          body: JSON.stringify({ userId: user.betterAuthUserId }),
        });

        await auth.handler(betterAuthRequest);
      }

      return response.ok({
        message: 'All sessions revoked successfully',
      });
    } catch (error) {
      logger.error('Failed to revoke all sessions:', error);
      return response.internalServerError({
        message: 'Failed to revoke all sessions',
      });
    }
  }
}
