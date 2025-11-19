import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import app from '@adonisjs/core/services/app';
import { betterAuth } from 'better-auth';
import { username, emailOTP, haveIBeenPwned, admin } from 'better-auth/plugins';
import Database from 'better-sqlite3';
import { DateTime } from 'luxon';
import { Pool } from 'pg';

import type {
  BetterAuthBeforeSignUpContext,
  BetterAuthBeforePasswordUpdateContext,
  BetterAuthAfterSignUpContext,
  BetterAuthAfterSignInContext,
  BetterAuthAfterFailedSignInContext,
  BetterAuthBeforeSignInContext,
} from '#types/better_auth';

import User from '#models/user';
import { EmailService } from '#services/email_service';
import { PasswordValidatorService } from '#services/password_validator_service';
import { UserSyncService } from '#services/user_sync_service';
import env from '#start/env';

/**
 * Better Auth Configuration
 *
 * This follows the recommended pattern from Better Auth documentation:
 * https://www.better-auth.com/docs/installation
 */

// Determine database connection
const dbConnection = env.get('DB_CONNECTION', 'sqlite');

let database;
if (dbConnection === 'postgres') {
  // PostgreSQL: Pass Pool instance directly
  database = new Pool({
    host: env.get('DB_HOST', 'localhost'),
    port: env.get('DB_PORT', 5432),
    user: env.get('DB_USER', 'postgres'),
    password: env.get('DB_PASSWORD', ''),
    database: env.get('DB_DATABASE', 'adonis_db'),
    max: 10,
  });
} else {
  // SQLite: Pass Database instance directly
  // Ensure tmp directory exists before creating database
  const dbPath = app.tmpPath('db.sqlite3');
  mkdirSync(dirname(dbPath), { recursive: true });
  database = new Database(dbPath);
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
        // Check reserved usernames
        const reserved = [
          'admin',
          'administrator',
          'root',
          'system',
          'api',
          'www',
          'mail',
          'ftp',
          'localhost',
          'test',
          'demo',
          'support',
          'help',
          'info',
          'contact',
          'about',
          'terms',
          'privacy',
          'settings',
          'account',
          'profile',
          'dashboard',
          'login',
          'logout',
          'signup',
          'register',
        ];

        if (reserved.includes(username.toLowerCase())) {
          return false;
        }

        // Must match your validation rules
        const valid =
          /^[a-z0-9_]+$/.test(username) &&
          !username.startsWith('_') &&
          !username.endsWith('_') &&
          !username.includes('__');
        return valid;
      },

      // Username normalization (lowercase, trim)
      // Better Auth stores normalized username and original in displayUsername
      usernameNormalization: (username) => username.toLowerCase().trim(),

      // Display username normalization (optional - keep original case)
      // If not provided, displayUsername will be set to original username before normalization
      displayUsernameNormalization: false, // Keep original case for display

      // Optional: Validate display username separately
      // displayUsernameValidator: (displayUsername) => {
      //   // Custom validation if needed
      //   return true;
      // },
    }),
    emailOTP({
      /**
       * Send OTP via email
       * Better Auth handles OTP generation, validation, and expiration
       */
      async sendVerificationOTP({ email, otp, type }) {
        try {
          await EmailService.sendOTP({
            to: email,
            otp,
            type: type as 'email-verification' | 'sign-in' | 'password-reset',
          });
        } catch (error: unknown) {
          console.error('Failed to send OTP:', error);
          throw new Error('Failed to send verification code. Please try again.');
        }
      },

      // OTP configuration
      otpLength: 6, // 6-digit OTP

      // Override default email verification to use OTP instead of link
      overrideDefaultEmailVerification: true,
    }),
    haveIBeenPwned({
      // Customize error message (optional)
      customPasswordCompromisedMessage:
        'This password has been exposed in a data breach. Please choose a different password.',
    }),
    admin({
      // Only use for session management and impersonation
      // Don't use for user CRUD or role management (AdonisJS is canonical)
      defaultRole: 'user', // Default role (but AdonisJS is canonical)

      // Admin roles - align with AdonisJS roles
      adminRoles: ['admin'],

      // Optional: Allow specific user IDs to be admin (for initial setup)
      adminUserIds: [],

      // Impersonation settings
      impersonationSessionDuration: 60 * 60, // 1 hour
    }),
  ],

  // Email & Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // Require email verification before account activation
  },

  // Email verification configuration
  // When using emailOTP plugin with overrideDefaultEmailVerification: true,
  // this still controls auto-sign-in behavior
  emailVerification: {
    autoSignInAfterVerification: true, // Auto sign in user after email verification
    sendOnSignUp: true, // Send verification email automatically after sign up
  },

  // OAuth providers
  socialProviders: {
    google: {
      clientId: env.get('GOOGLE_CLIENT_ID', ''),
      clientSecret: env.get('GOOGLE_CLIENT_SECRET', ''),
      enabled: !!(env.get('GOOGLE_CLIENT_ID') && env.get('GOOGLE_CLIENT_SECRET')),
    },
    github: {
      clientId: env.get('GITHUB_CLIENT_ID', ''),
      clientSecret: env.get('GITHUB_CLIENT_SECRET', ''),
      enabled: !!(env.get('GITHUB_CLIENT_ID') && env.get('GITHUB_CLIENT_SECRET')),
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
    cookiePrefix: 'better_auth',
    useSecureCookies: env.get('NODE_ENV') === 'production',
    defaultCookieAttributes: {
      sameSite: 'lax',
    },
  },

  // Security
  trustedOrigins: [
    'http://localhost:3000', // Nuxt dev
    env.get('NUXT_PUBLIC_SITE_URL', 'http://localhost:3000'),
  ],

  secret: env.get('BETTER_AUTH_SECRET', env.get('APP_KEY')),
  baseURL: env.get('BETTER_AUTH_URL', 'http://localhost:3333'),

  // Use Better Auth's standard hooks to sync users and handle account lockout
  // These hooks are called by Better Auth automatically - we don't modify Better Auth
  hooks: {
    /**
     * Validate password strength on sign-up
     * Note: Better Auth Have I Been Pwned plugin runs automatically before this hook
     */
    // @ts-expect-error - Better Auth hook types may not include all hooks
    beforeSignUp: async ({ input }: BetterAuthBeforeSignUpContext) => {
      const { password } = input;

      if (password) {
        const validation = PasswordValidatorService.validate(password);
        if (!validation.isValid) {
          // Combine errors with feedback
          const errorMessage = [...validation.errors, ...validation.feedback.suggestions].join(
            '. '
          );

          throw new Error(errorMessage);
        }
      }
    },

    /**
     * Validate password strength on password change
     * Note: Better Auth Have I Been Pwned plugin runs automatically before this hook
     */
    beforePasswordUpdate: async ({ input }: BetterAuthBeforePasswordUpdateContext) => {
      const { newPassword } = input;

      if (newPassword) {
        const validation = PasswordValidatorService.validate(newPassword);
        if (!validation.isValid) {
          const errorMessage = [...validation.errors, ...validation.feedback.suggestions].join(
            '. '
          );

          throw new Error(errorMessage);
        }
      }
    },

    /**
     * Called after user signs up via Better Auth
     * We sync the user to our Adonis users table
     */
    onAfterSignUp: async ({ user, account }: BetterAuthAfterSignUpContext) => {
      try {
        // Extract request context if available with robust type guards
        const request = account?.request;
        const headers =
          request && typeof request === 'object' && 'headers' in request
            ? request.headers
            : undefined;
        const getHeader =
          headers &&
          typeof headers === 'object' &&
          'get' in headers &&
          typeof headers.get === 'function'
            ? headers.get.bind(headers)
            : undefined;
        const clientIp =
          (getHeader?.('x-forwarded-for') as string | undefined)?.split(',')[0]?.trim() ||
          (getHeader?.('x-real-ip') as string | undefined) ||
          null;
        const requestPath =
          request &&
          typeof request === 'object' &&
          'url' in request &&
          typeof request.url === 'string'
            ? request.url
            : null;

        // Upsert Adonis User record
        // This stores the mapping in our database (users.better_auth_user_id)
        await UserSyncService.syncUser({
          betterAuthUser: user,
          provider: account?.providerId || 'email',
          requestPath: requestPath || undefined,
          clientIp: clientIp || undefined,
        });

        // Return user unchanged - Better Auth continues with its flow
        // We don't modify Better Auth's user object or session metadata
        return user;
      } catch (error) {
        // Log error but don't break Better Auth flow
        console.error('Error syncing user after sign-up:', error);
        return user; // Always return original user unchanged
      }
    },

    /**
     * Called after user signs in via Better Auth
     * We sync/update the user in our Adonis users table
     * This handles profile updates from OAuth providers
     */
    onAfterSignIn: async ({ user, account }: BetterAuthAfterSignInContext) => {
      try {
        // Extract request context if available with robust type guards
        const request = account?.request;
        const headers =
          request && typeof request === 'object' && 'headers' in request
            ? request.headers
            : undefined;
        const getHeader =
          headers &&
          typeof headers === 'object' &&
          'get' in headers &&
          typeof headers.get === 'function'
            ? headers.get.bind(headers)
            : undefined;
        const clientIp =
          (getHeader?.('x-forwarded-for') as string | undefined)?.split(',')[0]?.trim() ||
          (getHeader?.('x-real-ip') as string | undefined) ||
          null;
        const requestPath =
          request &&
          typeof request === 'object' &&
          'url' in request &&
          typeof request.url === 'string'
            ? request.url
            : null;

        // Upsert Adonis User record (updates if exists, creates if new)
        const adonisUser = await UserSyncService.syncUser({
          betterAuthUser: user,
          provider: account?.providerId || 'email',
          requestPath: requestPath || undefined,
          clientIp: clientIp || undefined,
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
        console.error('Error syncing user after sign-in:', error);
        return user; // Always return original user unchanged
      }
    },

    /**
     * Called after a failed sign-in attempt
     * Track failed attempts and lock account after threshold
     */
    afterFailedSignIn: async ({ user, account: _account }: BetterAuthAfterFailedSignInContext) => {
      try {
        if (!user?.id) return;

        // Find Adonis user by better_auth_user_id
        const adonisUser = await User.findBy('better_auth_user_id', user.id);
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
        console.error('Error tracking failed sign-in attempt:', error);
        // Don't throw - let Better Auth continue its error flow
      }
    },

    /**
     * Called before sign-in attempt
     * Check if account is locked
     */
    beforeSignIn: async ({ user }: BetterAuthBeforeSignInContext) => {
      if (!user?.id) return;

      const adonisUser = await User.findBy('better_auth_user_id', user.id);
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
