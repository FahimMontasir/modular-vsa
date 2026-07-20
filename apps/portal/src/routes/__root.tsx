import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { FormDevtoolsPanel } from "@tanstack/react-form-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { Toaster } from "@modular-vsa/ui/sonner";
import { ThemeProvider } from "@modular-vsa/ui/theme";
import { TooltipProvider } from "@modular-vsa/ui/tooltip";

export interface RouterAppContext {
  queryClient: QueryClient;
  __i18nPromise: Promise<void>;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  beforeLoad: async ({ context }) => {
    await context.__i18nPromise;
  },
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
      <I18nProvider i18n={i18n}>
        <ThemeProvider>
          <TooltipProvider>
            <Outlet />
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </I18nProvider>
      <TanStackDevtools
        plugins={[
          {
            name: "TanStack Query",
            render: <ReactQueryDevtoolsPanel />,
          },
          {
            name: "TanStack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
          {
            name: "TanStack Form",
            render: <FormDevtoolsPanel />,
          },
        ]}
      />
    </>
  );
}
