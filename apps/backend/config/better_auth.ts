import app from "@adonisjs/core/services/app";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import Database from "better-sqlite3";
import { Pool } from "pg";

import env from "#start/env";

/**
 * Better Auth Configuration
 *
 * This follows the recommended pattern from Better Auth documentation:
 * https://www.better-auth.com/docs/installation
 */

// Determine database connection
const dbConnection = env.get("DB_CONNECTION", "sqlite");

let database;
if (dbConnection === "postgres") {
  // PostgreSQL: Pass Pool instance directly
  database = new Pool({
    host: env.get("DB_HOST", "localhost"),
    port: env.get("DB_PORT", 5432),
    user: env.get("DB_USER", "postgres"),
    password: env.get("DB_PASSWORD", ""),
    database: env.get("DB_DATABASE", "adonis_db"),
    max: 10,
  });
} else {
  // SQLite: Pass Database instance directly
  database = new Database(app.tmpPath("db.sqlite3"));
}

// Initialize Better Auth instance (direct export, no wrapper)
export const auth = betterAuth({
  database,

  plugins: [
    username({
      // Username validation rules
      minUsernameLength: 3,
      maxUsernameLength: 30,

      // Custom validator - only lowercase, numbers, underscores
      usernameValidator: (username) => {
        // Must match your validation rules
        const valid =
          /^[a-z0-9_]+$/.test(username) &&
          !username.startsWith("_") &&
          !username.endsWith("_") &&
          !username.includes("__");
        return valid;
      },

      // Reserved usernames (align with your requirements)
      reservedUsernames: [
        "admin",
        "administrator",
        "root",
        "system",
        "api",
        "www",
        "mail",
        "ftp",
        "localhost",
        "test",
        "demo",
        "support",
        "help",
        "info",
        "contact",
        "about",
        "terms",
        "privacy",
        "settings",
        "account",
        "profile",
        "dashboard",
        "login",
        "logout",
        "signup",
        "register",
      ],

      // Normalize username (lowercase, trim)
      normalize: (username) => username.toLowerCase().trim(),
    }),
  ],

  // Email & Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // TODO: Enable with email provider
  },

  // OAuth providers
  socialProviders: {
    google: {
      clientId: env.get("GOOGLE_CLIENT_ID", ""),
      clientSecret: env.get("GOOGLE_CLIENT_SECRET", ""),
      enabled: !!(env.get("GOOGLE_CLIENT_ID") && env.get("GOOGLE_CLIENT_SECRET")),
    },
    github: {
      clientId: env.get("GITHUB_CLIENT_ID", ""),
      clientSecret: env.get("GITHUB_CLIENT_SECRET", ""),
      enabled: !!(env.get("GITHUB_CLIENT_ID") && env.get("GITHUB_CLIENT_SECRET")),
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: false, // Keep disabled to ensure session_token is used
    },
  },

  // Advanced settings
  advanced: {
    cookiePrefix: "better_auth",
    useSecureCookies: env.get("NODE_ENV") === "production",
    defaultCookieAttributes: {
      sameSite: "lax",
    },
  },

  // Security
  trustedOrigins: [
    "http://localhost:3000", // Nuxt dev
    env.get("NUXT_PUBLIC_SITE_URL", "http://localhost:3000"),
  ],

  secret: env.get("BETTER_AUTH_SECRET", env.get("APP_KEY")),
  baseURL: env.get("BETTER_AUTH_URL", "http://localhost:3333"),

  // Email sender (placeholder for future implementation)
  // emailAndPassword: {
  //   sendResetPassword: async ({ user, url }) => {
  //     // TODO: Implement email sending
  //   },
  //   sendVerificationEmail: async ({ user, url }) => {
  //     // TODO: Implement email sending
  //   },
  // },
});
