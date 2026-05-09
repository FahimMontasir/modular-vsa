import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    APP_NAME: z.string().default("ModularVSAApp"),
    DASHBOARD_APP_NAME: z.string().default("ModularVSADashboard"),
    PORT: z.coerce.number().min(3).default(3000),
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    BULLMQ_PREFIX: z.string(),
    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.string(),
    REDIS_PASSWORD: z.string(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
