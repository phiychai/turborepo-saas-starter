import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "users";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id").primary();
      table.string("full_name").nullable();
      table.string("email", 255).notNullable().unique();
      table.string("password", 180).notNullable();
      table.enum("role", ["user", "admin"]).defaultTo("user").notNullable();
      table.boolean("is_active").defaultTo(true).notNullable();

      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").nullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}

