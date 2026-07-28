import { ApiError } from "@modular-vsa/shared/server/apiError";

import type { AccessControlPermissions } from "../access-control";

type ResolvedSession = {
  user: { id: string };
  session: unknown;
};

export async function resolveAuthorization<TSession extends ResolvedSession>(options: {
  permissions: true | AccessControlPermissions;
  getSession: () => Promise<TSession | null>;
  userHasPermission: (userId: string, permissions: AccessControlPermissions) => Promise<boolean>;
}) {
  const authSession = await options.getSession();

  if (!authSession) {
    throw new ApiError("Unauthorized", "Authentication required");
  }

  if (
    options.permissions !== true &&
    !(await options.userHasPermission(authSession.user.id, options.permissions))
  ) {
    throw new ApiError("Forbidden", "You do not have permission to perform this action");
  }

  return authSession;
}
