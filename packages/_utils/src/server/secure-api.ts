import { Elysia, type ElysiaConfig } from "elysia";

import { AuthMiddleware } from "@modular-vsa/auth/middleware/index";

/**
 * Base Elysia instance with common middleware This provides type propagation and security to
 * all routes that extend it
 */
export function secureAPI<const BasePath extends string = "">(config?: ElysiaConfig<BasePath>) {
  return (
    new Elysia(config)
      /** Using auth middleware for authentication */
      .use(AuthMiddleware)
    /** add other middleware */
  );
}
