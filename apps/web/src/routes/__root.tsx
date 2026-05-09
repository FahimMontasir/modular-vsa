import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { APIClientProvider } from "@modular-vsa/api-bridge/provider";
import { Toaster } from "@modular-vsa/ui/sonner";
import { TooltipProvider } from "@modular-vsa/ui/tooltip";

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "modular-vsa",
      },
      {
        name: "description",
        content: "modular-vsa is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <APIClientProvider>
        <TooltipProvider>
          <Outlet />
        </TooltipProvider>
        <Toaster />
      </APIClientProvider>

      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}
