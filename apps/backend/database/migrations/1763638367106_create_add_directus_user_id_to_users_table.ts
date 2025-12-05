import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'users';

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('directus_user_id').nullable();
      table.index('directus_user_id');
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex('directus_user_id');
      table.dropColumn('directus_user_id');
    });
  }
}
