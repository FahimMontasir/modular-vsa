import { adminClient, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { env } from "@modular-vsa/env/web";

import { ac, roles } from "../access-control";

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
export const authClient = createAuthClient({
  baseURL: new URL(env.VITE_SERVER_URL).origin,
  fetchOptions: { throw: true, credentials: "include" },
  plugins: [adminClient({ ac, roles }), usernameClient()],
});
