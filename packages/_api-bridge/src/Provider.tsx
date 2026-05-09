import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
  PersistQueryClientProvider,
  persistQueryClientRestore,
} from "@tanstack/react-query-persist-client";

import { queryClient } from "./index";

const persister = createAsyncStoragePersister({ storage: localStorage });

function resumePausedMutations() {
  queryClient.resumePausedMutations().then(() => {
    queryClient.invalidateQueries();
  });
}

export function restoreQueryCache() {
  persistQueryClientRestore({ persister, queryClient }).then(resumePausedMutations);
}

export function APIClientProvider({ children }: React.PropsWithChildren) {
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
