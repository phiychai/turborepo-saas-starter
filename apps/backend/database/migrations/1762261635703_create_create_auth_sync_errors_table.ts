import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'auth_sync_errors';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();

      // Event classification
      table.string('event_type', 50).notNullable(); // 'upsert_failed', 'missing_mapping', 'token_inconsistency', 'sync_failed'
      table.string('provider', 50).nullable(); // 'email', 'google', 'github', etc.

      // Identifiers
      table.string('external_user_id').nullable(); // Better Auth user ID
      table.string('email_hash', 255).nullable(); // Hashed email (bcrypt) for privacy
      table.integer('adonis_user_id').nullable().unsigned();

      // Request context
      table.string('request_path', 500).nullable();
      table.string('client_ip_hash', 255).nullable(); // Hashed IP address (bcrypt) for GDPR compliance

      // Error details
      table.text('error').notNullable();
      table.json('payload').nullable(); // Truncated and sanitized payload (max 1KB, sensitive fields redacted)

      // Data retention
      table.timestamp('expires_at').nullable(); // Auto-delete after 90 days for GDPR compliance

      // Retry management
      table.integer('retry_count').defaultTo(0).notNullable();
      table.boolean('handled').defaultTo(false).notNullable();

      // Timestamps
      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at').nullable();

      // Indexes
      table.index('event_type');
      table.index('external_user_id');
      table.index('adonis_user_id');
      table.index('handled');
      table.index('created_at');
      table.index('expires_at'); // For cleanup job
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
