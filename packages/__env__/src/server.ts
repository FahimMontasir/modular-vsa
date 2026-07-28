import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    APP_NAME: z.string().default("ModularVSAApp"),
    DASHBOARD_APP_NAME: z.string().default("ModularVSADashboard"),
    PORT: z.coerce.number().min(3).default(3050),
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    BULLMQ_PREFIX: z.string(),
    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.string(),
    REDIS_PASSWORD: z.string(),
    LOG_SERVER_TOKEN: z.string(),
    S3_ACCESS_KEY_ID: z.string().default("garage-access"),
    S3_SECRET_ACCESS_KEY: z.string().default("garage-secret"),
    S3_BUCKET: z.string().default("modular-vsa"),
    S3_ENDPOINT: z.string().default("http://localhost:3900"),
    S3_REGION: z.string().default("garage"),
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),
  },
  runtimeEnv: Bun.env,
  emptyStringAsUndefined: true,
});
