/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from "@adonisjs/core/env";

export default await Env.create(new URL("../", import.meta.url), {
  NODE_ENV: Env.schema.enum(["development", "production", "test"] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: "host" }),
  LOG_LEVEL: Env.schema.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_CONNECTION: Env.schema.string.optional(),
  DB_HOST: Env.schema.string({ format: "host" }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring Redis
  |----------------------------------------------------------
  */
  REDIS_HOST: Env.schema.string({ format: "host" }),
  REDIS_PORT: Env.schema.number(),
  REDIS_PASSWORD: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(["cookie", "memory", "redis"] as const),

  /*
  |----------------------------------------------------------
  | Variables for JWT authentication
  |----------------------------------------------------------
  */
  JWT_SECRET: Env.schema.string.optional(),
  JWT_EXPIRES_IN: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for Directus integration
  |----------------------------------------------------------
  */
  DIRECTUS_URL: Env.schema.string(),
  DIRECTUS_ADMIN_EMAIL: Env.schema.string(),
  DIRECTUS_ADMIN_PASSWORD: Env.schema.string(),
  DIRECTUS_STATIC_TOKEN: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for Lago Billing integration
  |----------------------------------------------------------
  */
  LAGO_API_URL: Env.schema.string(),
  LAGO_API_KEY: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for Payment Gateway integration
  |----------------------------------------------------------
  */
  STRIPE_SECRET_KEY: Env.schema.string.optional(),
  STRIPE_PUBLISHABLE_KEY: Env.schema.string.optional(),
  STRIPE_WEBHOOK_SECRET: Env.schema.string.optional(),

  PAYPAL_CLIENT_ID: Env.schema.string.optional(),
  PAYPAL_CLIENT_SECRET: Env.schema.string.optional(),
  PAYPAL_MODE: Env.schema.enum.optional(["sandbox", "production"] as const),
});
