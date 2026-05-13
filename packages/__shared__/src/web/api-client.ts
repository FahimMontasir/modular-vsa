import { treaty } from "@elysiajs/eden";

import { env } from "@modular-vsa/env/web";

/**
 * Create a new API client with custom configuration Use this function when you need to customize
 * the client, such as specifying a different base URL or adding additional configuration.
 */
export function createApiClient<T>() {
  //@ts-ignore
  return treaty<T>(env.VITE_SERVER_URL, {
    fetch: { credentials: "include", mode: "cors" },
  });
}
