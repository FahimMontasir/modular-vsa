import { MutationCache, QueryCache, QueryClient, type QueryKey } from "@tanstack/react-query";

import { toast } from "../../../_ui/src/components/sonner";

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
