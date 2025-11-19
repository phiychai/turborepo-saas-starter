import '@adonisjs/core/http';
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
    // auth is already declared by @adonisjs/auth, we just extend with additional properties
    // bouncer is declared in initialize_bouncer_middleware.ts
    betterAuthUser?: BetterAuthUser;
    betterAuthSession?: BetterAuthSession;
  }
}

