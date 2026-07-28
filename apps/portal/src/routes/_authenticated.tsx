import { createFileRoute, redirect } from "@tanstack/react-router";

import { PortalShell } from "../components/portal-shell";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: PortalShell,
});
