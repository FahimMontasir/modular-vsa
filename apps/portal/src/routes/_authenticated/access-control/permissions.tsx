import { createFileRoute } from "@tanstack/react-router";

import { AccessPermissionsPage } from "@modular-vsa/auth/pages/access-permissions-page";

export const Route = createFileRoute("/_authenticated/access-control/permissions")({
  component: AccessPermissionsPage,
});
