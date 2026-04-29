import type { cors } from "@elysiajs/cors";

import { env } from "@modular-vsa/env/server";

type CORSConfig = Parameters<typeof cors>[0];

/**
 * CORS Configuration for the server
 *
 * This utility contains the Cross-Origin Resource Sharing (CORS) configuration.
 * CORS settings define which origins are allowed to access the API and what methods/headers they can use.
 *
 * @see https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
 */
export const CORS_CONFIG = {
  origin: env.CORS_ORIGIN,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
} satisfies CORSConfig;
