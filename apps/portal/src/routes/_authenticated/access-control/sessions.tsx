import { createFileRoute } from "@tanstack/react-router";

import { AccessSessionsPage } from "@modular-vsa/auth/pages/access-sessions-page";

export const Route = createFileRoute("/_authenticated/access-control/sessions")({
  component: AccessSessionsPage,
});
