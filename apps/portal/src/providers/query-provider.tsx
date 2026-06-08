import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
  PersistQueryClientProvider,
  persistQueryClientRestore,
} from "@tanstack/react-query-persist-client";

import { queryClient } from "@modular-vsa/shared/web/query-client";

const persister = createAsyncStoragePersister({ storage: localStorage });

function resumePausedMutations() {
  queryClient.resumePausedMutations().then(() => {
    queryClient.invalidateQueries();
  });
}

export function restoreQueryCache() {
  persistQueryClientRestore({ persister, queryClient }).then(resumePausedMutations);
}

export function QueryClientProvider({ children }: React.PropsWithChildren) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
      onSuccess={resumePausedMutations}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
