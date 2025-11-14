import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'users';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();

      // Link to Better Auth user
      table.string('better_auth_user_id').nullable().unique();
      table.index('better_auth_user_id');

      // Profile fields
      table.string('first_name').nullable();
      table.string('last_name').nullable();
      table.string('username').nullable().unique();
      table.string('avatar_url').nullable();
      table.string('email', 255).notNullable().unique();

      // Legacy fields (kept for backward compatibility, but password will not be used with Better Auth)
      table.string('full_name').nullable();
      table.string('password', 180).nullable();

      // Authorization
      table.enum('role', ['user', 'admin']).defaultTo('user').notNullable();
      table.boolean('is_active').defaultTo(true).notNullable();

      // Preferences (JSON field)
      table.json('preferences').nullable();

      // Account lockout fields (for Better Auth hooks)
      table.integer('failed_attempts').defaultTo(0).notNullable();
      table.timestamp('locked_until').nullable();

      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at').nullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
