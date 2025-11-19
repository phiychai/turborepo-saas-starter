import { BaseModel, column } from '@adonisjs/lucid/orm';
import { DateTime } from 'luxon';

import type { AuthSyncErrorPayload } from '@turborepo-saas-starter/shared-types';

export type AuthSyncErrorType =
  | 'upsert_failed'
  | 'missing_mapping'
  | 'token_inconsistency'
  | 'sync_failed'
  | 'reconciliation_failed';

export default class AuthSyncError extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare eventType: AuthSyncErrorType;

  @column()
  declare provider: string | null;

  @column()
  declare externalUserId: string | null;

  @column()
  declare emailHash: string | null; // Hashed email for privacy (bcrypt)

  @column()
  declare adonisUserId: number | null;

  @column()
  declare requestPath: string | null;

  @column()
  declare clientIpHash: string | null; // Hashed IP address for GDPR compliance (bcrypt)

  @column()
  declare error: string;

  @column({
    prepare: (value) => {
      if (!value) return null;
      // Sanitize and truncate payload
      const sanitized = AuthSyncError.sanitizePayload(value);
      const json = JSON.stringify(sanitized);
      if (json.length > 1024) {
        return `${json.substring(0, 1024)}..."`;
      }
      return json;
    },
    consume: (value) => {
      if (!value) return null;
      return typeof value === 'string' ? JSON.parse(value) : value;
    },
  })
  declare payload: AuthSyncErrorPayload | null;

  /**
   * Sanitize payload by redacting sensitive fields
   */
  static sanitizePayload(payload: AuthSyncErrorPayload): AuthSyncErrorPayload {
    const sensitiveKeys = [
      'password',
      'token',
      'apiKey',
      'secret',
      'creditCard',
      'ssn',
      'api_key',
      'access_token',
      'refresh_token',
    ];
    const sanitized = { ...payload };

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
      // Also sanitize nested objects
      if (
        typeof sanitized[key] === 'object' &&
        sanitized[key] !== null &&
        !Array.isArray(sanitized[key])
      ) {
        sanitized[key] = AuthSyncError.sanitizePayload(sanitized[key]);
      }
    }

    return sanitized;
  }

  @column.dateTime()
  declare expiresAt: DateTime | null; // Auto-delete after 90 days

  @column()
  declare retryCount: number;

  @column()
  declare handled: boolean;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null;

  // Helper methods
  async markAsHandled() {
    this.handled = true;
    await this.save();
  }

  async incrementRetry() {
    this.retryCount++;
    await this.save();
  }
}
