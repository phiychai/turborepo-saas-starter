import '@adonisjs/core/http';
import type User from '#models/user';

declare module '@adonisjs/core/http' {
  interface HttpContext {
    auth: {
      user: User;
    };
    // bouncer is declared in initialize_bouncer_middleware.ts
    betterAuthUser?: any;
    betterAuthSession?: any;
  }
}
