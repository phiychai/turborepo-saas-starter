import "@adonisjs/core/types/http";
import User from "#models/user";

declare module "@adonisjs/core/types/http" {
  interface HttpContext {
    auth: {
      user: User;
    };
    betterAuthUser?: any;
    betterAuthSession?: any;
  }
}

