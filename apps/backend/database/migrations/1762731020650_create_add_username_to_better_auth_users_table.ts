import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Add username columns to Better Auth user table
 *
 * According to Better Auth Username Plugin documentation:
 * https://www.better-auth.com/docs/plugins/username#schema
 *
 * The plugin requires 2 fields:
 * - username: The normalized username (lowercase, trimmed)
 * - displayUsername: The non-normalized username (original case)
 */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('user', (table) => {
      // Username field - normalized (lowercase, trimmed)
      table.string('username').nullable().unique();

      // Display username - non-normalized (original case)
      table.string('displayUsername').nullable();
    });
  }

  async down() {
    this.schema.alterTable('user', (table) => {
      table.dropColumn('username');
      table.dropColumn('displayUsername');
    });
  }
}