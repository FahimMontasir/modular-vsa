import { createFileRoute } from "@tanstack/react-router";

import { AccessUsersPage } from "@modular-vsa/auth/pages/access-users-page";

export const Route = createFileRoute("/_authenticated/access-control/users")({
  component: AccessUsersPage,
});
