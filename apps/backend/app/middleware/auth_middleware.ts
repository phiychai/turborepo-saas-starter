import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";
import { auth } from "#config/better_auth";

/**
 * Auth middleware is used authenticate HTTP requests using Better Auth
 * and deny access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = "/login";

  async handle(ctx: HttpContext, next: NextFn) {
    try {
      // Convert AdonisJS request to fetch Request for Better Auth
      const url = new URL(ctx.request.url(), `http://${ctx.request.header("host")}`);

      const fetchRequest = new Request(url, {
        method: ctx.request.method(),
        headers: ctx.request.headers() as HeadersInit,
      });

      // Validate session using Better Auth
      const session = await auth.api.getSession({ headers: fetchRequest.headers });

      if (!session || !session.user) {
        return ctx.response.unauthorized({
          message: "Unauthorized. Please login to continue.",
        });
      }

      // Attach user to context for use in controllers
      // @ts-ignore - Adding Better Auth user to context
      ctx.betterAuthUser = session.user;
      // @ts-ignore - Adding Better Auth session to context
      ctx.betterAuthSession = session.session;

      return next();
    } catch (error) {
      return ctx.response.unauthorized({
        message: "Authentication failed",
      });
    }
  }
}
