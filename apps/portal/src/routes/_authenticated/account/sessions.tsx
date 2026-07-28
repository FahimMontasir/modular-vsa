import { createFileRoute } from "@tanstack/react-router";

import { AccountSessionsPage } from "@modular-vsa/auth/pages/account-sessions-page";

export const Route = createFileRoute("/_authenticated/account/sessions")({
  component: AccountSessionsPage,
});
