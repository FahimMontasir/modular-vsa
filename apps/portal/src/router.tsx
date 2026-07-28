import { createRouter } from "@tanstack/react-router";

import { queryClient } from "@modular-vsa/shared/web/query-client";

import type { RouterAppContext } from "./routes/__root";
import { routeTree } from "./routeTree.gen";

const routerContext = {
  queryClient,
  auth: undefined!,
} satisfies RouterAppContext;

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
