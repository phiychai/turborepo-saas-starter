import '@adonisjs/core/http';
import type User from '#models/user';
import type { BetterAuthUser } from '#services/user_sync_service';

/**
 * Better Auth session object
 */
export interface BetterAuthSession {
  id: string;
  expiresAt?: Date | string;
  [key: string]: unknown;
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    auth: {
      user: User;
    };
    // bouncer is declared in initialize_bouncer_middleware.ts
    betterAuthUser?: BetterAuthUser;
    betterAuthSession?: BetterAuthSession;
  }
}
