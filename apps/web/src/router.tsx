import { createRouter as createTanStackRouter } from "@tanstack/react-router";

import { initializeI18n } from "@modular-vsa/i18n/i18n";
import { queryClient } from "@modular-vsa/shared/web/query-client";

import type { RouterAppContext } from "./routes/__root";
import { routeTree } from "./routeTree.gen";

const __i18nPromise = initializeI18n();

export function createRouter() {
  const routerContext: RouterAppContext = { queryClient, __i18nPromise };

  return createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    scrollRestorationBehavior: "smooth",
    context: routerContext,
  });
}
