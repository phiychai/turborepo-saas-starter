import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  async up() {
    // Better Auth User table (default name: user)
    // Note: Better Auth uses camelCase column names by default
    this.schema.createTable("user", (table) => {
      table.string("id").primary();
      table.string("email", 255).notNullable().unique();
      table.boolean("emailVerified").defaultTo(false).notNullable();
      table.string("name").nullable();
      table.string("image").nullable();
      table.timestamp("createdAt").notNullable();
      table.timestamp("updatedAt").notNullable();
    });

    // Better Auth Session table (default name: session)
    this.schema.createTable("session", (table) => {
      table.string("id").primary();
      table.timestamp("expiresAt").notNullable();
      table.string("token").notNullable().unique();
      table.string("ipAddress").nullable();
      table.string("userAgent").nullable();
      table.string("userId").notNullable();
      table.foreign("userId").references("id").inTable("user").onDelete("CASCADE");
      table.timestamp("createdAt").notNullable();
      table.timestamp("updatedAt").notNullable();
    });

    // Better Auth Account table (for OAuth)
    this.schema.createTable("account", (table) => {
      table.string("id").primary();
      table.string("accountId").notNullable();
      table.string("providerId").notNullable();
      table.string("userId").notNullable();
      table.string("accessToken").nullable();
      table.string("refreshToken").nullable();
      table.string("idToken").nullable();
      table.timestamp("accessTokenExpiresAt").nullable();
      table.timestamp("refreshTokenExpiresAt").nullable();
      table.string("scope").nullable();
      table.text("password").nullable();
      table.timestamp("createdAt").notNullable();
      table.timestamp("updatedAt").notNullable();

      table.foreign("userId").references("id").inTable("user").onDelete("CASCADE");
      table.unique(["providerId", "accountId"]);
    });

    // Better Auth Verification table
    this.schema.createTable("verification", (table) => {
      table.string("id").primary();
      table.string("identifier").notNullable();
      table.string("value").notNullable();
      table.timestamp("expiresAt").notNullable();
      table.timestamp("createdAt").nullable();
      table.timestamp("updatedAt").nullable();
    });
  }

  async down() {
    this.schema.dropTable("verification");
    this.schema.dropTable("account");
    this.schema.dropTable("session");
    this.schema.dropTable("user");
  }
}
