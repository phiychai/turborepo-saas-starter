import { compose } from '@adonisjs/core/helpers';
import { BaseModel, column } from '@adonisjs/lucid/orm';
import { DateTime } from 'luxon';

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  // Link to Better Auth
  @column()
  declare betterAuthUserId: string | null;

  // Profile fields
  @column()
  declare firstName: string | null;

  @column()
  declare lastName: string | null;

  @column()
  declare username: string | null;

  @column()
  declare email: string;

  @column()
  declare avatarUrl: string | null;

  // Authorization
  @column()
  declare role: 'user' | 'admin';

  @column()
  declare isActive: boolean;

  // Account lockout (managed via Better Auth hooks)
  @column()
  declare failedAttempts: number;

  @column.dateTime()
  declare lockedUntil: DateTime | null;

  // Preferences
  @column({
    prepare: (value) => JSON.stringify(value),
    consume: (value) => (typeof value === 'string' ? JSON.parse(value) : value),
  })
  declare preferences: Record<string, any> | null;

  // Legacy fields (kept for backward compatibility, but password will not be used with Better Auth)
  @column()
  declare fullName: string | null;

  @column({ serializeAs: null })
  declare password: string | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null;

  // Computed properties
  get fullNameComputed(): string | null {
    if (this.firstName || this.lastName) {
      return [this.firstName, this.lastName].filter(Boolean).join(' ') || null;
    }
    return null;
  }

  get displayName(): string {
    return this.username || this.fullNameComputed || this.fullName || this.email;
  }

  // Note: Username generation is handled by Better Auth Username Plugin
  // We sync the username from Better Auth to this table
}
