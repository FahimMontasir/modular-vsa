import { createFileRoute } from "@tanstack/react-router";

import { AccountProfilePage } from "@modular-vsa/auth/pages/account-profile-page";

export const Route = createFileRoute("/_authenticated/account/profile")({
  component: AccountProfilePage,
});
