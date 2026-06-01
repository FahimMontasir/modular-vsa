import { QueryCache, QueryClient } from "@tanstack/react-query";

import { logger } from "../common/logger";

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
    onError(error) {
      logger.error("[queryclient] error ->", error);
    },
  }),
});

export type AppQueryClient = typeof queryClient;
