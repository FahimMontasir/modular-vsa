import { describe, expect, test } from "bun:test";

import { parseEnv } from "../src/parse";
import { ServerEnvSchema } from "../src/server-schema";
import { WebEnvSchema } from "../src/web-schema";

const validServerEnv = {
  NODE_ENV: "development",
  APP_NAME: "ModularVSAApp",
  DASHBOARD_APP_NAME: "ModularVSADashboard",
  PORT: "3000",
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/modular_vsa",
  BETTER_AUTH_SECRET: "local-development-secret-at-least-32-characters",
  BETTER_AUTH_URL: "http://localhost:3100",
  BOOTSTRAP_ADMIN_NAME: "Local Administrator",
  BOOTSTRAP_ADMIN_EMAIL: "admin@modular-vsa.local",
  BOOTSTRAP_ADMIN_USERNAME: "admin",
  BOOTSTRAP_ADMIN_PASSWORD: "local-admin-password-123",
  CORS_ORIGIN: "http://localhost:3001",
  BULLMQ_PREFIX: "modular-vsa",
  REDIS_HOST: "localhost",
  REDIS_PORT: "6380",
  REDIS_PASSWORD: "redis-dev",
  REDIS_URL: "redis://:redis-dev@localhost:6380",
  LOG_SERVER_TOKEN: "local-log-token",
  S3_ACCESS_KEY_ID: "GK00000000000000000000000000000000",
  S3_SECRET_ACCESS_KEY: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  S3_BUCKET: "modular-vsa",
  S3_ENDPOINT: "http://localhost:3900",
  S3_REGION: "garage",
};

const validWebEnv = {
  VITE_SERVER_URL: "http://localhost:3100/api/v1",
  VITE_FIREBASE_API_KEY: "firebase-api-key",
  VITE_FIREBASE_AUTH_DOMAIN: "travel-horse.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "travel-horse",
  VITE_FIREBASE_STORAGE_BUCKET: "travel-horse.firebasestorage.app",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "757164574402",
  VITE_FIREBASE_APP_ID: "1:757164574402:web:a75e958e2ec3994af41d5b",
  VITE_FIREBASE_VAPID_KEY: "firebase-vapid-key",
};

describe("parseEnv", () => {
  test("coerces explicitly configured numeric values", () => {
    const parsed = parseEnv(ServerEnvSchema, {
      ...validServerEnv,
      PORT: "3100",
      REDIS_PORT: "6390",
    });

    expect(parsed.PORT).toBe(3100);
    expect(parsed.REDIS_PORT).toBe(6390);
    expect(parsed.NODE_ENV).toBe("development");
  });

  test("accepts the six-character password minimum", () => {
    const parsed = parseEnv(ServerEnvSchema, {
      ...validServerEnv,
      BOOTSTRAP_ADMIN_PASSWORD: "123456",
    });

    expect(parsed.BOOTSTRAP_ADMIN_PASSWORD).toBe("123456");
  });

  test("treats empty optional values as missing", () => {
    const parsed = parseEnv(WebEnvSchema, {
      ...validWebEnv,
      VITE_FIREBASE_MEASUREMENT_ID: "",
    });

    expect(parsed.VITE_FIREBASE_MEASUREMENT_ID).toBeUndefined();
  });

  test("rejects missing required values", () => {
    expect(() => parseEnv(ServerEnvSchema, { ...validServerEnv, DATABASE_URL: "" })).toThrow();
    expect(() => parseEnv(ServerEnvSchema, { ...validServerEnv, PORT: "" })).toThrow();
    expect(() =>
      parseEnv(ServerEnvSchema, { ...validServerEnv, BOOTSTRAP_ADMIN_PASSWORD: "short" })
    ).toThrow();
    expect(() => parseEnv(WebEnvSchema, { ...validWebEnv, VITE_FIREBASE_VAPID_KEY: "" })).toThrow();
  });

  test("rejects malformed URLs and numeric values", () => {
    expect(() =>
      parseEnv(WebEnvSchema, { ...validWebEnv, VITE_SERVER_URL: "not-a-url" })
    ).toThrow();
    expect(() => parseEnv(ServerEnvSchema, { ...validServerEnv, REDIS_PORT: "nope" })).toThrow();
  });
});
