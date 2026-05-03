import { HomeRoutes } from "@modular-vsa/home/server/controllers/routes";
import { secureAPI } from "@modular-vsa/utils/server/secure-api";

/**
 * This is the main entry point for the API version 1 routes. It is exported as APIV1 and can be
 * used in the main server file to register the routes. All other route files should be imported and
 * used in this file to keep the API versioning organized and maintainable.
 *
 * @example
 *   .use(SecurityRoutes)
 */
export const APIV1 = secureAPI({
  prefix: "/api/v1",
  // sanitize: [Bun.escapeHTML], // default is true
}).use(HomeRoutes);
