import logger from '@adonisjs/core/services/logger';

import type { BetterAuthInstance } from '#types/better_auth';
import type { HttpContext } from '@adonisjs/core/http';

import * as abilities from '#abilities/main';
import { auth as betterAuth } from '#config/better_auth';
import User from '#models/user';
import env from '#start/env';
import { toWebRequest } from '#utils/better_auth_helpers';

export default class AdminSessionsController {
  /**
   * @listUserSessions
   * @summary List user sessions (admin)
   * @description Retrieves all active sessions for a specific user from Better Auth. Admin only endpoint.
   * @tag Admin
   * @paramPath {string} id - User ID (UUID, required)
   * @response 200 - User sessions retrieved successfully
   * @response 400 - Bad request - User not linked to Better Auth
   * @response 401 - Unauthorized - Authentication required
   * @response 403 - Forbidden - Admin access required
   * @response 404 - User not found
   * @response 500 - Server error - Failed to list sessions
   */
  async listUserSessions({ params, request, response, auth }: HttpContext) {
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
      const betterAuthInstance = betterAuth as BetterAuthInstance;
      if (betterAuthInstance.api?.listUserSessions) {
        const sessions = await betterAuthInstance.api.listUserSessions({
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

        const betterAuthResponse = await betterAuthInstance.handler?.(betterAuthRequest);
        if (!betterAuthResponse) {
          throw new Error('Better Auth handler not available');
        }
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
   * @revokeSession
   * @summary Revoke user session (admin)
   * @description Revokes a specific user session by session token. The user will be logged out from that session. Admin only endpoint.
   * @tag Admin
   * @paramPath {string} sessionToken - Session token to revoke (required)
   * @response 200 - Session revoked successfully
   * @response 401 - Unauthorized - Authentication required
   * @response 403 - Forbidden - Admin access required
   * @response 404 - Session not found
   * @response 500 - Server error - Failed to revoke session
   */
  async revokeSession({ params, request, response, auth }: HttpContext) {
    await abilities.manageUsers.execute(auth.user!);

    try {
      const webRequest = await toWebRequest(request);

      // Use Better Auth API method if available
      const betterAuthInstance = betterAuth as BetterAuthInstance;
      if (betterAuthInstance.api?.revokeUserSession) {
        await betterAuthInstance.api.revokeUserSession({
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

        const response = await betterAuthInstance.handler?.(betterAuthRequest);
        if (!response) {
          throw new Error('Better Auth handler not available');
        }
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
   * @revokeAllSessions
   * @summary Revoke all user sessions (admin)
   * @description Revokes all active sessions for a specific user. The user will be logged out from all devices. Admin only endpoint.
   * @tag Admin
   * @paramPath {string} id - User ID (UUID, required)
   * @response 200 - All sessions revoked successfully
   * @response 400 - Bad request - User not linked to Better Auth
   * @response 401 - Unauthorized - Authentication required
   * @response 403 - Forbidden - Admin access required
   * @response 404 - User not found
   * @response 500 - Server error - Failed to revoke sessions
   */
  async revokeAllSessions({ params, request, response, auth }: HttpContext) {
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
      const betterAuthInstance = betterAuth as BetterAuthInstance;
      if (betterAuthInstance.api?.revokeUserSessions) {
        await betterAuthInstance.api.revokeUserSessions({
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

        const response = await betterAuthInstance.handler?.(betterAuthRequest);
        if (!response) {
          throw new Error('Better Auth handler not available');
        }
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
