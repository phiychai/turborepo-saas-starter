import hash from '@adonisjs/core/services/hash';
import logger from '@adonisjs/core/services/logger';
import { DateTime } from 'luxon';

import AuthSyncError from '#models/auth_sync_error';

export type AuthSyncErrorType =
  | 'upsert_failed'
  | 'missing_mapping'
  | 'token_inconsistency'
  | 'sync_failed'
  | 'reconciliation_failed';

export interface LogErrorOptions {
  eventType: AuthSyncErrorType;
  provider?: string | null;
  externalUserId?: string | null;
  email?: string | null;
  adonisUserId?: number | null;
  requestPath?: string | null;
  clientIp?: string | null;
  error: string | Error;
  payload?: Record<string, any> | null;
}

export class AuthErrorLogger {
  /**
   * Log an authentication sync error
   */
  static async logError(options: LogErrorOptions): Promise<AuthSyncError> {
    const errorMessage = options.error instanceof Error ? options.error.message : options.error;

    // Truncate and sanitize payload to avoid bloating database
    const truncatedPayload = options.payload ? this.truncatePayload(options.payload) : null;

    // Hash sensitive data before storing
    const emailHash = options.email ? await hash.make(options.email) : null;
    const ipHash = options.clientIp ? await hash.make(options.clientIp) : null;

    // Set expiration date (90 days for GDPR compliance)
    const expiresAt = DateTime.now().plus({ days: 90 });

    try {
      const error = await AuthSyncError.create({
        eventType: options.eventType,
        provider: options.provider,
        externalUserId: options.externalUserId,
        emailHash,
        adonisUserId: options.adonisUserId,
        requestPath: options.requestPath,
        clientIpHash: ipHash,
        error: errorMessage,
        payload: truncatedPayload,
        retryCount: 0,
        handled: false,
        expiresAt,
      });

      logger.error(`Auth sync error logged: ${options.eventType}`, {
        errorId: error.id,
        externalUserId: options.externalUserId,
        // Don't log email for security
      });

      return error;
    } catch (logError: any) {
      // If logging fails, at least log to console
      logger.error(`Failed to log auth sync error: ${logError.message}`, {
        originalError: errorMessage,
      });
      throw logError;
    }
  }

  /**
   * Truncate payload to max 1KB
   */
  private static truncatePayload(payload: Record<string, any>): Record<string, any> {
    // First sanitize
    const sanitized = AuthSyncError.sanitizePayload(payload);
    const json = JSON.stringify(sanitized);

    if (json.length <= 1024) {
      return sanitized;
    }

    // Truncate and add indicator
    const truncated = JSON.parse(json.substring(0, 1024));
    truncated._truncated = true;
    return truncated;
  }

  /**
   * Get unhandled errors
   */
  static async getUnhandledErrors(limit: number = 100): Promise<AuthSyncError[]> {
    return AuthSyncError.query().where('handled', false).orderBy('createdAt', 'desc').limit(limit);
  }

  /**
   * Get errors by type
   */
  static async getErrorsByType(
    eventType: AuthSyncErrorType,
    limit: number = 100
  ): Promise<AuthSyncError[]> {
    return AuthSyncError.query()
      .where('eventType', eventType)
      .where('handled', false)
      .orderBy('createdAt', 'desc')
      .limit(limit);
  }

  /**
   * Get error statistics
   */
  static async getErrorStats(): Promise<{
    total: number;
    unhandled: number;
    byType: Record<string, number>;
    recentErrors: number; // Last 24 hours
  }> {
    const db = await import('@adonisjs/lucid/services/db');
    const yesterday = DateTime.now().minus({ days: 1 });

    const [total, unhandled, byType, recent] = await Promise.all([
      db.default.from('auth_sync_errors').count('* as total').first(),
      db.default.from('auth_sync_errors').where('handled', false).count('* as total').first(),
      db.default
        .from('auth_sync_errors')
        .where('handled', false)
        .select('event_type')
        .count('* as count')
        .groupBy('event_type'),
      db.default
        .from('auth_sync_errors')
        .where('created_at', '>', yesterday.toSQL())
        .count('* as total')
        .first(),
    ]);

    const byTypeMap: Record<string, number> = {};
    byType.forEach((row: any) => {
      byTypeMap[row.event_type] = parseInt(row.count || '0');
    });

    return {
      total: parseInt((total?.total as string) || '0'),
      unhandled: parseInt((unhandled?.total as string) || '0'),
      byType: byTypeMap,
      recentErrors: parseInt((recent?.total as string) || '0'),
    };
  }
}
