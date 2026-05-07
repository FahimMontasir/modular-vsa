import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

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
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
      <Toaster />
      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}
