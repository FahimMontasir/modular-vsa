import { createFileRoute } from "@tanstack/react-router";

import { AccountConnectionsPage } from "@modular-vsa/auth/pages/account-connections-page";

export const Route = createFileRoute("/_authenticated/account/connections")({
  component: AccountConnectionsPage,
});
