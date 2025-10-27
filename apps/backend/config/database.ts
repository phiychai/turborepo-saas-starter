import env from "#start/env";
import app from "@adonisjs/core/services/app";
import { defineConfig } from "@adonisjs/lucid";

const dbConfig = defineConfig({
  connection: env.get("DB_CONNECTION", "postgres"),
  connections: {
    postgres: {
      client: "pg",
      connection: {
        host: env.get("DB_HOST", "localhost"),
        port: env.get("DB_PORT", 5432),
        user: env.get("DB_USER", "postgres"),
        password: env.get("DB_PASSWORD", "postgres"),
        database: env.get("DB_DATABASE", "adonis_db"),
      },
      migrations: {
        naturalSort: true,
        paths: ["database/migrations"],
      },
      healthCheck: true,
      debug: env.get("NODE_ENV") === "development",
    },
    sqlite: {
      client: "better-sqlite3",
      connection: {
        filename: app.tmpPath("db.sqlite3"),
      },
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ["database/migrations"],
      },
    },
  },
});

export default dbConfig;
