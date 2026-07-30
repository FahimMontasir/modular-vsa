import { t } from "elysia";

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./auth-policy";

function nonEmptyString() {
  return t.String({ minLength: 1 });
}

function url() {
  return t.String({ format: "uri" });
}

export const ServerEnvSchema = t.Object({
  APP_NAME: nonEmptyString(),
  DASHBOARD_APP_NAME: nonEmptyString(),
  PORT: t.Numeric({ minimum: 3, maximum: 65_535 }),
  DATABASE_URL: nonEmptyString(),
  BETTER_AUTH_SECRET: t.String({ minLength: 32 }),
  BETTER_AUTH_URL: url(),
  BOOTSTRAP_ADMIN_NAME: nonEmptyString(),
  BOOTSTRAP_ADMIN_EMAIL: t.String({ format: "email" }),
  BOOTSTRAP_ADMIN_USERNAME: t.String({ minLength: 3, maxLength: 30 }),
  BOOTSTRAP_ADMIN_PASSWORD: t.String({
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
  }),
  CORS_ORIGIN: url(),
  NODE_ENV: t.Union([t.Literal("development"), t.Literal("production"), t.Literal("test")]),
  BULLMQ_PREFIX: nonEmptyString(),
  REDIS_HOST: nonEmptyString(),
  REDIS_PORT: t.Numeric({ minimum: 1, maximum: 65_535 }),
  REDIS_PASSWORD: nonEmptyString(),
  REDIS_URL: url(),
  LOG_SERVER_TOKEN: nonEmptyString(),
  S3_ACCESS_KEY_ID: nonEmptyString(),
  S3_SECRET_ACCESS_KEY: nonEmptyString(),
  S3_BUCKET: nonEmptyString(),
  S3_ENDPOINT: url(),
  S3_REGION: nonEmptyString(),
  GARAGE_WEBUI_HOST: t.Optional(nonEmptyString()),
  GARAGE_WEBUI_PORT: t.Optional(t.Numeric({ minimum: 1, maximum: 65_535 })),
  GARAGE_WEBUI_USERNAME: t.Optional(nonEmptyString()),
  GARAGE_WEBUI_PASSWORD: t.Optional(nonEmptyString()),
  DRIZZLE_STUDIO_HOST: t.Optional(nonEmptyString()),
  DRIZZLE_STUDIO_PORT: t.Optional(t.Numeric({ minimum: 1, maximum: 65_535 })),
  DRIZZLE_STUDIO_URL: t.Optional(url()),
  FIREBASE_PROJECT_ID: t.Optional(nonEmptyString()),
  FIREBASE_CLIENT_EMAIL: t.Optional(t.String({ format: "email" })),
  FIREBASE_PRIVATE_KEY: t.Optional(nonEmptyString()),
  FIREBASE_SERVICE_ACCOUNT_PATH: t.Optional(nonEmptyString()),
});

export type ServerEnv = typeof ServerEnvSchema.static;
