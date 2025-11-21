import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'users';

  async up() {
    // Update role enum to include new roles
    // Note: PostgreSQL requires dropping and recreating the enum, SQLite doesn't support enums
    this.schema.alterTable(this.tableName, (table) => {
      // For PostgreSQL, we need to drop the constraint first, then recreate
      // For SQLite, we just change the column type
      table.string('role', 50).defaultTo('user').notNullable().alter();
    });

    // No need to migrate existing 'user' values - they stay as 'user'
    // Existing 'admin' values also stay as 'admin'
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Revert to original enum (only 'user' and 'admin')
      table.enum('role', ['user', 'admin']).defaultTo('user').notNullable().alter();
    });
  }
}
