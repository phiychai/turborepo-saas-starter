import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "sessions";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string("id").primary();
      table.integer("user_id").unsigned().references("id").inTable("users").onDelete("CASCADE");
      table.string("ip_address", 45).nullable();
      table.text("user_agent").nullable();
      table.text("payload").notNullable();
      table.timestamp("last_activity").notNullable();
      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").nullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}

