import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  async up() {
    // Add Better Auth Admin plugin fields to user table
    // According to Better Auth docs: https://www.better-auth.com/docs/plugins/admin#schema
    // The Admin plugin adds: role, banned, banReason, banExpires
    // Note: AdonisJS is still the canonical source for roles - these fields are for Better Auth Admin plugin compatibility
    this.schema.alterTable('user', (table) => {
      // Role field - string, optional, defaults to 'user'
      table.string('role', 50).nullable().defaultTo('user');

      // Ban fields for Better Auth Admin plugin
      table.boolean('banned').nullable().defaultTo(false);
      table.string('banReason').nullable();
      table.timestamp('banExpires').nullable();
    });

    // Add impersonatedBy field to session table
    this.schema.alterTable('session', (table) => {
      table.string('impersonatedBy').nullable();
    });
  }

  async down() {
    this.schema.alterTable('user', (table) => {
      table.dropColumn('role');
      table.dropColumn('banned');
      table.dropColumn('banReason');
      table.dropColumn('banExpires');
    });

    this.schema.alterTable('session', (table) => {
      table.dropColumn('impersonatedBy');
    });
  }
}
