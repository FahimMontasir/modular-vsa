import { createRouter } from "@tanstack/react-router";

import { initializeI18n } from "@modular-vsa/i18n/i18n";
import { queryClient } from "@modular-vsa/shared/web/query-client";

import type { RouterAppContext } from "./routes/__root";
import { routeTree } from "./routeTree.gen";

const __i18nPromise = initializeI18n();
const routerContext = { queryClient, __i18nPromise } satisfies RouterAppContext;

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  scrollRestorationBehavior: "smooth",
  context: routerContext,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
