import { treaty } from "@elysiajs/eden";
import { MutationCache, QueryCache, QueryClient, type QueryKey } from "@tanstack/react-query";
import { createAuthClient } from "better-auth/react";

import { env } from "@modular-vsa/env/web";
import type { APIServerType } from "@modular-vsa/server/types";
import { toast } from "@modular-vsa/ui/sonner";

/** Eden + auth base URL (Vite injects `import.meta.env.*`). */
export const API_URL = env.VITE_SERVER_URL;

/**
 * The pre-configured API client instance
 *
 * Use this client for making API calls to the backend. The client structure mirrors the API routes
 * of the backend.
 *
 * @example
 *   ```ts
 *   // Get all users
 *   const users = await apiClient.api.v1.user.get();
 *
 *   // Get a specific user
 *   const user = await apiClient.api.v1.user({ uid: "123" }).get();
 *
 *   // Create a new resource
 *   const newResource = await apiClient.api.v1.resource.post({
 *     body: { name: "New Resource" },
 *   });
 *   ```;
 */
export const apiClient = treaty<APIServerType>(API_URL, {
  fetch: { credentials: "include", mode: "cors" },
});

/** Type representing the API client structure This type is inferred from the client instance */
export type APIClient = typeof apiClient;

/**
 * Create a new API client with custom configuration
 *
 * Use this function when you need to customize the client, such as specifying a different base URL
 * or adding additional configuration.
 *
 * @example
 *   ```ts
 *   // Create a client with a custom base URL
 *   const apiClient = createAPIClient("https://api.example.com");
 *
 *   // Create a client with additional configuration
 *   const apiClient = createAPIClient("https://api.example.com", {
 *     fetch: { credentials: "include", mode: "cors" },
 *   });
 *
 *   // Make API calls
 *   const profile = await apiClient.api.v1.user({ uid: "me" }).get();
 *   ```;
 *
 * @param args - The arguments to pass to the treaty function
 * @returns A new client instance
 */
export function createAPIClient(...args: Parameters<typeof treaty>): APIClient {
  return treaty<APIServerType>(...args);
}

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
  baseURL: API_URL,
  fetchOptions: { throw: true },
  plugins: [],
});

/**
 * The pre-configured query client instance
 *
 * @example
 *   ```ts
 *   // Prefetch a query
 *   const session = await queryClient.prefetchQuery({
 *     queryKey: ["user"],
 *     queryFn: () => apiClient.api.v1.user.get(),
 *   });
 *   ```;
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      gcTime: 30 * 1000,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({
    onError(error, query) {
      console.error("[queryclient] error ->", error);
      toast.error(query.meta?.errorMessage || "Something went wrong");
    },
  }),
  mutationCache: new MutationCache({
    onSuccess(_d, _v, _c, mutation) {
      if (mutation.meta?.invalidatesQuery) {
        invalidateQueries(mutation.meta.invalidatesQuery);
      }
      if (mutation.meta?.successMessage) {
        toast.success(mutation.meta.successMessage);
      }
    },
    onError(error, _v, _c, mutation) {
      if (mutation.meta?.invalidatesOnError && mutation.meta.invalidatesQuery) {
        invalidateQueries(mutation.meta.invalidatesQuery);
      }
      console.error("[queryclient] error ->", error);
      toast.error(mutation.meta?.errorMessage || "Something went wrong");
    },
  }),
});

function invalidateQueries(queryKeys: QueryKey) {
  if (Array.isArray(queryKeys) && Array.isArray(queryKeys[0])) {
    for (const queryKey of queryKeys) {
      queryClient.invalidateQueries({ queryKey: queryKey as string[] });
    }
  } else {
    queryClient.invalidateQueries({ queryKey: queryKeys });
  }
}

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: {
      errorMessage?: string;
    };
    mutationMeta: {
      invalidatesQuery?: QueryKey;
      invalidatesOnError?: boolean;
      successMessage?: string;
      errorMessage?: string;
    };
  }
}
