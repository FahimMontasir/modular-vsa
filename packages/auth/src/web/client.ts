import { createAuthClient } from "better-auth/react";

import { env } from "@modular-vsa/env/web";

/**
 * The pre-configured authentication client instance
 *
 * Use this client for making authentication API calls to the backend. The client structure mirrors
 * the authentication API routes of the backend.
 *
 * @example
 *   ```ts
 *   // Get the current user session
 *   const session = await authClient.useSession();
 *   ```;
 */
export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
  fetchOptions: { throw: true },
  plugins: [],
});
