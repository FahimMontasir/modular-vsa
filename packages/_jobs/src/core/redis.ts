import type { ConnectionOptions, DefaultJobOptions, WorkerOptions } from "bullmq";

import { env } from "@modular-vsa/env/server";

/** Redis connection shared by every queue and worker. */
export const REDIS_CONNECTION = {
  host: env.REDIS_HOST,
  port: Number(env.REDIS_PORT),
  password: env.REDIS_PASSWORD,
  tls: env.REDIS_HOST !== "localhost" ? { rejectUnauthorized: false } : undefined,
} satisfies ConnectionOptions;

/** Redis key prefix for BullMQ keys. */
export const BULL_REDIS_PREFIX = env.BULLMQ_PREFIX;

/** Default options applied to every enqueued job. */
export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 1000 },
  removeOnComplete: { age: 24 * 3600 },
  removeOnFail: { age: 7 * 24 * 3600 },
} satisfies DefaultJobOptions;

/** Default worker configuration. */
export const DEFAULT_WORKER_OPTIONS = {
  concurrency: 10,
  autorun: true,
} satisfies Partial<WorkerOptions>;
