import logger from '@adonisjs/core/services/logger';
import db from '@adonisjs/lucid/services/db';

import User from '#models/user';
import { AuthErrorLogger } from '#services/auth_error_logger';
import { DirectusUserSyncService } from '#services/directus_user_sync_service';

export interface BetterAuthUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
  username?: string | null; // If using Better Auth Username Plugin
}

export interface SyncUserOptions {
  betterAuthUser: BetterAuthUser;
  provider?: string;
  requestPath?: string;
  clientIp?: string;
  role?: 'user' | 'admin' | 'content_admin' | 'editor' | 'writer'; // Optional role override (for admin-created users)
}

export class UserSyncService {
  /**
   * Validate Better Auth user data before processing
   */
  private static validateBetterAuthUser(user: BetterAuthUser): void {
    if (!user.id || typeof user.id !== 'string' || user.id.length > 255) {
      throw new Error('Invalid Better Auth user ID');
    }
    if (!user.email || typeof user.email !== 'string' || user.email.length > 255) {
      throw new Error('Invalid email address');
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      throw new Error('Invalid email format');
    }
    if (user.name && user.name.length > 255) {
      throw new Error('Name too long');
    }
    if (user.image && (user.image.length > 2048 || !user.image.startsWith('http'))) {
      throw new Error('Invalid image URL');
    }
  }

  /**
   * Upsert Adonis User from Better Auth user data
   * Uses database transaction to prevent race conditions
   *
   * For frontend registrations: role defaults to 'user' (no Directus user created)
   * For admin-created users: role can be specified (Directus user created if content role)
   */
  static async syncUser(options: SyncUserOptions): Promise<User | null> {
    const { betterAuthUser, provider, requestPath, clientIp, role } = options;

    try {
      // Validate input data before processing
      this.validateBetterAuthUser(betterAuthUser);

      // Extract name components from Better Auth name field
      const nameParts = this.parseName(betterAuthUser.name);

      // Use transaction with row locking to prevent race conditions
      const user = await db.transaction(async (trx) => {
        // Use SELECT FOR UPDATE to lock rows during sync
        const existingUser = await User.query({ client: trx })
          .where('better_auth_user_id', betterAuthUser.id)
          .orWhere('email', betterAuthUser.email)
          .forUpdate()
          .first();

        if (existingUser) {
          // Update existing user
          existingUser.betterAuthUserId = betterAuthUser.id;
          existingUser.email = betterAuthUser.email;
          existingUser.firstName = nameParts.firstName || existingUser.firstName;
          existingUser.lastName = nameParts.lastName || existingUser.lastName;
          existingUser.avatarUrl = betterAuthUser.image || existingUser.avatarUrl;

          // Sync username from Better Auth if using Username Plugin
          if (betterAuthUser.username) {
            existingUser.username = betterAuthUser.username;
          }

          // Set role if provided, otherwise keep existing role or default to 'user'
          if (role !== undefined) {
            existingUser.role = role;
          } else if (!existingUser.role) {
            existingUser.role = 'user';
          }

          // Set default isActive if not set
          if (existingUser.isActive === undefined) {
            existingUser.isActive = true;
          }

          await existingUser.save();
          return existingUser;
        } else {
          // Create new user (ensure email is always set - OAuth providers should return email)
          if (!betterAuthUser.email) {
            throw new Error('Email is required for user creation');
          }

          // Create new user
          // Note: If using Better Auth Username Plugin, username will be in betterAuthUser.username
          // Use provided role or default to 'user' for frontend registrations
          const userRole = role || 'user';
          const newUser = await User.create({
            betterAuthUserId: betterAuthUser.id,
            email: betterAuthUser.email,
            firstName: nameParts.firstName,
            lastName: nameParts.lastName,
            username: betterAuthUser.username || null, // Sync username from Better Auth if available
            avatarUrl: betterAuthUser.image,
            role: userRole,
            isActive: true,
            failedAttempts: 0,
            lockedUntil: null,
            preferences: null,
            directusUserId: null, // Will be set if Directus user is created
          });
          return newUser;
        }
      });

      // If role requires Directus user, sync to Directus
      // This happens for admin-created users with content roles
      if (role && DirectusUserSyncService.requiresDirectusUser(role)) {
        const finalRole = role || user.role;
        await DirectusUserSyncService.syncUserToDirectus(user, finalRole);
      }

      logger.info(`User synced successfully: ${user.id} (${user.email})`);
      return user;
    } catch (error: unknown) {
      // Log error to auth_sync_errors table (with security measures)
      await AuthErrorLogger.logError({
        eventType: 'upsert_failed',
        provider: provider || 'email',
        externalUserId: betterAuthUser.id,
        email: betterAuthUser.email, // Will be hashed in AuthErrorLogger
        adonisUserId: null,
        requestPath,
        clientIp, // Will be hashed in AuthErrorLogger
        error: error instanceof Error ? error.message : String(error),
        payload: {
          betterAuthUserId: betterAuthUser.id,
          // Don't include email/name in payload - they'll be in separate fields (hashed)
        },
      });

      // Log to console without sensitive data
      logger.error(
        `Failed to sync user: ${error instanceof Error ? error.message : String(error)}`,
        {
          externalUserId: betterAuthUser.id,
          // Don't log email or other sensitive data
        }
      );
      return null;
    }
  }

  /**
   * Parse full name into first and last name
   */
  private static parseName(name: string | null | undefined): {
    firstName: string | null;
    lastName: string | null;
  } {
    if (!name) {
      return { firstName: null, lastName: null };
    }

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: null };
    } else if (parts.length === 2) {
      return { firstName: parts[0], lastName: parts[1] };
    } else {
      // Multiple words: first word is first name, rest is last name
      return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' '),
      };
    }
  }
}
