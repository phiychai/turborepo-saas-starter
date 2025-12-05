import type { HttpContext } from '@adonisjs/core/http';

import { auth } from '#config/better_auth';
import { toWebRequest, fromWebResponse } from '#utils/better_auth_helpers';

export default class AuthController {
  /**
   * Base handler for all Better Auth endpoints
   * This method is shared by all auth routes to avoid code duplication
   */
  private async handleAuthRequest({ request, response }: HttpContext) {
    try {
      const webRequest = await toWebRequest(request);
      const authResponse = await auth.handler(webRequest);

      // Workaround: Check if response contains PASSWORD_COMPROMISED error for sign-in requests
      // The haveIBeenPwned plugin should NOT check passwords during sign-in, only during sign-up
      // This is a workaround for a Better Auth bug where the plugin incorrectly checks passwords
      // during sign-in (observed when calling directly via Swagger, but not through the login page)
      // This defensive check ensures sign-in always returns generic "Invalid credentials" errors
      const isSignInRequest = request.url()?.includes('/sign-in/email');
      if (isSignInRequest && authResponse.status >= 400) {
        // Clone response to read body without consuming the original
        const responseClone = authResponse.clone();
        try {
          const responseBody = await responseClone.json();

          if (
            responseBody?.code === 'PASSWORD_COMPROMISED' ||
            responseBody?.message?.includes('data breach') ||
            responseBody?.message?.includes('PASSWORD_COMPROMISED')
          ) {
            // Convert to generic invalid credentials error for sign-in
            // Password breach checks should only happen during sign-up, not sign-in
            return response.status(401).send({
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
            });
          }
        } catch {
          // If response is not JSON, continue with normal handling
        }
      }

      return await fromWebResponse(authResponse, response);
    } catch (error: unknown) {
      console.error('Better Auth handler error:', error);

      // Workaround: If PASSWORD_COMPROMISED error occurs during sign-in, convert to generic error
      const isSignInRequest = request.url()?.includes('/sign-in/email');
      if (isSignInRequest) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('PASSWORD_COMPROMISED') || errorMessage.includes('data breach')) {
          return response.status(401).send({
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          });
        }
      }

      return response.status(500).send({
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * @signInEmail
   * @summary Sign in with email
   * @description Authenticates a user with email and password. Returns a session token and user information.
   * @tag Authentication
   * @requestBody {"email": "user@example.com", "password": "password123"}
   * @response 200 - Sign in successful, returns user and session
   * @response 401 - Invalid credentials
   * @response 400 - Bad request - Missing email or password
   */
  async signInEmail(ctx: HttpContext) {
    return this.handleAuthRequest(ctx);
  }

  /**
   * @signUpEmail
   * @summary Sign up with email
   * @description Creates a new user account with email and password. Email verification may be required depending on configuration.
   * @tag Authentication
   * @requestBody {"email": "user@example.com", "password": "password123", "name": "John Doe", "username": "johndoe"}
   * @response 201 - Account created successfully
   * @response 400 - Bad request - Invalid input or email already exists
   * @response 409 - Conflict - Email or username already in use
   */
  async signUpEmail(ctx: HttpContext) {
    return this.handleAuthRequest(ctx);
  }

  /**
   * @signOut
   * @summary Sign out
   * @description Signs out the current user and invalidates their session.
   * @tag Authentication
   * @response 200 - Sign out successful
   * @response 401 - Unauthorized - No active session
   */
  async signOut(ctx: HttpContext) {
    return this.handleAuthRequest(ctx);
  }

  /**
   * @getSession
   * @summary Get current session
   * @description Retrieves the current authenticated user's session information.
   * @tag Authentication
   * @response 200 - Session information retrieved successfully
   * @response 401 - Unauthorized - No active session
   */
  async getSession(ctx: HttpContext) {
    return this.handleAuthRequest(ctx);
  }

  /**
   * @catchAll
   * @summary Better Auth catch-all handler
   * @description Handles all other Better Auth endpoints that aren't explicitly defined. This is a catch-all route for Better Auth functionality.
   * @tag Authentication
   * @response 200 - Request processed successfully
   * @response 400 - Bad request
   * @response 401 - Unauthorized
   * @response 500 - Server error
   */
  async catchAll(ctx: HttpContext) {
    return this.handleAuthRequest(ctx);
  }
}
