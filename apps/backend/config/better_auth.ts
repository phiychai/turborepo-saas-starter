import app from "@adonisjs/core/services/app";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import Database from "better-sqlite3";
import { Pool } from "pg";

import env from "#start/env";
import { UserSyncService } from "#services/user_sync_service";
import User from "#models/user";
import { DateTime } from "luxon";

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

  // Use Better Auth's standard hooks to sync users and handle account lockout
  // These hooks are called by Better Auth automatically - we don't modify Better Auth
  hooks: {
    /**
     * Called after user signs up via Better Auth
     * We sync the user to our Adonis users table
     */
    onAfterSignUp: async ({ user, account }) => {
      try {
        // Extract request context if available
        const request = (account as any)?.request;
        const clientIp =
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request?.headers?.get("x-real-ip") ||
          null;
        const requestPath = request?.url || null;

        // Upsert Adonis User record
        // This stores the mapping in our database (users.better_auth_user_id)
        await UserSyncService.syncUser({
          betterAuthUser: user,
          provider: account?.providerId || "email",
          requestPath,
          clientIp,
        });

        // Return user unchanged - Better Auth continues with its flow
        // We don't modify Better Auth's user object or session metadata
        return user;
      } catch (error) {
        // Log error but don't break Better Auth flow
        console.error("Error syncing user after sign-up:", error);
        return user; // Always return original user unchanged
      }
    },

    /**
     * Called after user signs in via Better Auth
     * We sync/update the user in our Adonis users table
     * This handles profile updates from OAuth providers
     */
    onAfterSignIn: async ({ user, account }) => {
      try {
        const request = (account as any)?.request;
        const clientIp =
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request?.headers?.get("x-real-ip") ||
          null;
        const requestPath = request?.url || null;

        // Upsert Adonis User record (updates if exists, creates if new)
        const adonisUser = await UserSyncService.syncUser({
          betterAuthUser: user,
          provider: account?.providerId || "email",
          requestPath,
          clientIp,
        });

        // Reset failed attempts on successful login
        if (adonisUser) {
          adonisUser.failedAttempts = 0;
          adonisUser.lockedUntil = null;
          if (!adonisUser.isActive) {
            adonisUser.isActive = true; // Reactivate if was locked
          }
          await adonisUser.save();
        }

        // Return user unchanged - Better Auth continues with its flow
        return user;
      } catch (error) {
        console.error("Error syncing user after sign-in:", error);
        return user; // Always return original user unchanged
      }
    },

    /**
     * Called after a failed sign-in attempt
     * Track failed attempts and lock account after threshold
     */
    afterFailedSignIn: async ({ user, account }) => {
      try {
        if (!user?.id) return;

        // Find Adonis user by better_auth_user_id
        const adonisUser = await User.findBy("better_auth_user_id", user.id);
        if (!adonisUser) return;

        // Increment failed attempts
        const failedAttempts = (adonisUser.failedAttempts || 0) + 1;
        adonisUser.failedAttempts = failedAttempts;

        // Lock account after 5 failed attempts (15 minute lockout)
        if (failedAttempts >= 5) {
          const lockUntil = DateTime.now().plus({ minutes: 15 });
          adonisUser.lockedUntil = lockUntil;
          adonisUser.isActive = false; // Or you can use lockedUntil field only
        }

        await adonisUser.save();
      } catch (error) {
        console.error("Error tracking failed sign-in attempt:", error);
        // Don't throw - let Better Auth continue its error flow
      }
    },

    /**
     * Called before sign-in attempt
     * Check if account is locked
     */
    beforeSignIn: async ({ user }) => {
      try {
        if (!user?.id) return;

        const adonisUser = await User.findBy("better_auth_user_id", user.id);
        if (!adonisUser) return;

        // Check if account is locked
        if (adonisUser.lockedUntil) {
          const lockDate = adonisUser.lockedUntil.toJSDate();
          if (lockDate > new Date()) {
            const minutesLeft = Math.ceil((lockDate.getTime() - Date.now()) / 60000);
            throw new Error(
              `Account is temporarily locked due to multiple failed login attempts. Try again in ${minutesLeft} minute(s).`
            );
          }
        }
      } catch (error: any) {
        // Re-throw to prevent sign-in
        throw error;
      }
    },
  },

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
