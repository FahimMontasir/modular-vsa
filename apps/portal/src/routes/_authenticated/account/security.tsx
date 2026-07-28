import { createFileRoute } from "@tanstack/react-router";

import { AccountSecurityPage } from "@modular-vsa/auth/pages/account-security-page";

export const Route = createFileRoute("/_authenticated/account/security")({
  component: AccountSecurityPage,
});
