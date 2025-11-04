import User from "#models/user";
import AuthSyncError from "#models/auth_sync_error";
import logger from "@adonisjs/core/services/logger";
import db from "@adonisjs/lucid/services/db";
import hash from "@adonisjs/core/services/hash";

export interface BetterAuthUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified?: boolean;
  username?: string | null; // If using Better Auth Username Plugin
}

export interface SyncUserOptions {
  betterAuthUser: BetterAuthUser;
  provider?: string;
  requestPath?: string;
  clientIp?: string;
}

export class UserSyncService {
  /**
   * Validate Better Auth user data before processing
   */
  private static validateBetterAuthUser(user: BetterAuthUser): void {
    if (!user.id || typeof user.id !== "string" || user.id.length > 255) {
      throw new Error("Invalid Better Auth user ID");
    }
    if (!user.email || typeof user.email !== "string" || user.email.length > 255) {
      throw new Error("Invalid email address");
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      throw new Error("Invalid email format");
    }
    if (user.name && user.name.length > 255) {
      throw new Error("Name too long");
    }
    if (user.image && (user.image.length > 2048 || !user.image.startsWith("http"))) {
      throw new Error("Invalid image URL");
    }
  }

  /**
   * Upsert Adonis User from Better Auth user data
   * Uses database transaction to prevent race conditions
   */
  static async syncUser(options: SyncUserOptions): Promise<User | null> {
    const { betterAuthUser, provider, requestPath, clientIp } = options;

    try {
      // Validate input data before processing
      this.validateBetterAuthUser(betterAuthUser);

      // Extract name components from Better Auth name field
      const nameParts = this.parseName(betterAuthUser.name);

      // Use transaction with row locking to prevent race conditions
      const user = await db.transaction(async (trx) => {
        // Use SELECT FOR UPDATE to lock rows during sync
        let existingUser = await User.query({ client: trx })
          .where("better_auth_user_id", betterAuthUser.id)
          .orWhere("email", betterAuthUser.email)
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
          if ((betterAuthUser as any).username) {
            existingUser.username = (betterAuthUser as any).username;
          }

          // Set default role if not set
          if (!existingUser.role) {
            existingUser.role = "user";
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
            throw new Error("Email is required for user creation");
          }

          // Create new user
          // Note: If using Better Auth Username Plugin, username will be in betterAuthUser.username
          const newUser = await User.create({
            betterAuthUserId: betterAuthUser.id,
            email: betterAuthUser.email,
            firstName: nameParts.firstName,
            lastName: nameParts.lastName,
            username: (betterAuthUser as any).username || null, // Sync username from Better Auth if available
            avatarUrl: betterAuthUser.image,
            role: "user",
            isActive: true,
            failedAttempts: 0,
            lockedUntil: null,
            preferences: null,
          });
          return newUser;
        }
      });

      logger.info(`User synced successfully: ${user.id} (${user.email})`);
      return user;
    } catch (error: any) {
      // Log error to auth_sync_errors table (with security measures)
      await this.logSyncError({
        eventType: "upsert_failed",
        provider: provider || "email",
        externalUserId: betterAuthUser.id,
        email: betterAuthUser.email, // Will be hashed in logSyncError
        adonisUserId: null,
        requestPath,
        clientIp, // Will be hashed in logSyncError
        error: error.message,
        payload: {
          betterAuthUserId: betterAuthUser.id,
          // Don't include email/name in payload - they'll be in separate fields (hashed)
        },
      });

      // Log to console without sensitive data
      logger.error(`Failed to sync user: ${error.message}`, {
        externalUserId: betterAuthUser.id,
        // Don't log email or other sensitive data
      });
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
        lastName: parts.slice(1).join(" "),
      };
    }
  }

  /**
   * Sanitize payload by redacting sensitive fields
   */
  private static sanitizePayload(payload: Record<string, any>): Record<string, any> {
    const sensitiveKeys = [
      "password",
      "token",
      "apiKey",
      "secret",
      "creditCard",
      "ssn",
      "api_key",
      "access_token",
      "refresh_token",
    ];
    const sanitized = { ...payload };

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
        sanitized[key] = "[REDACTED]";
      }
      // Also sanitize nested objects
      if (
        typeof sanitized[key] === "object" &&
        sanitized[key] !== null &&
        !Array.isArray(sanitized[key])
      ) {
        sanitized[key] = this.sanitizePayload(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Hash email address for privacy (one-way hash)
   */
  private static async hashEmail(email: string | null): Promise<string | null> {
    if (!email) return null;
    return await hash.make(email);
  }

  /**
   * Hash IP address for GDPR compliance (one-way hash)
   */
  private static async hashIp(ip: string | null): Promise<string | null> {
    if (!ip) return null;
    return await hash.make(ip);
  }

  /**
   * Log sync error to database with security measures
   */
  private static async logSyncError(data: {
    eventType: "upsert_failed" | "missing_mapping" | "token_inconsistency" | "sync_failed";
    provider?: string | null;
    externalUserId?: string | null;
    email?: string | null;
    adonisUserId?: number | null;
    requestPath?: string | null;
    clientIp?: string | null;
    error: string;
    payload?: Record<string, any> | null;
  }): Promise<void> {
    try {
      // Hash sensitive data before storing
      const emailHash = await this.hashEmail(data.email);
      const ipHash = await this.hashIp(data.clientIp);

      // Sanitize payload to remove sensitive fields
      const sanitizedPayload = data.payload ? this.sanitizePayload(data.payload) : null;

      // Set expiration date (90 days for GDPR compliance)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      await AuthSyncError.create({
        eventType: data.eventType,
        provider: data.provider,
        externalUserId: data.externalUserId,
        emailHash: emailHash, // Store hash instead of plain email
        adonisUserId: data.adonisUserId,
        requestPath: data.requestPath,
        clientIpHash: ipHash, // Store hash instead of plain IP
        error: data.error,
        payload: sanitizedPayload, // Sanitized payload
        retryCount: 0,
        handled: false,
        expiresAt: expiresAt,
      });
    } catch (logError: any) {
      // If logging fails, at least log to console (but don't include sensitive data)
      logger.error(`Failed to log sync error: ${logError.message}`);
    }
  }
}

