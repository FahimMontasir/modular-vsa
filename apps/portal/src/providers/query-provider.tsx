import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

import { QUERY_CACHE_MAX_AGE_MS, queryClient } from "@modular-vsa/shared/web/query-client";

const persister = createAsyncStoragePersister({ storage: window.localStorage });

async function resumePausedMutations() {
  await queryClient.resumePausedMutations();
  await queryClient.invalidateQueries();
}

export function QueryClientProvider({ children }: React.PropsWithChildren) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: QUERY_CACHE_MAX_AGE_MS }}
      onSuccess={resumePausedMutations}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
