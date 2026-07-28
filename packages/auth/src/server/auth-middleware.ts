import { Elysia } from "elysia";

import { getAuthInstance } from ".";
import type { AccessControlPermissions } from "../access-control";
import { resolveAuthorization } from "./authorization-core";

/**
 * Auth middleware
 *
 * This middleware is used to authenticate the user
 *
 * @example
 *   ```ts
 *   import { AuthMiddleware } from "@modular-vsa/auth";
 *
 *   const app = secureAPI().get(
 *     "/",
 *     ({ user, session }) => {
 *       return user;
 *     },
 *     { authorize: true }
 *   );
 *   ```;
 */
export const AuthMiddleware = new Elysia({
  name: "Auth Middleware",
}).macro({
  authorize: (permissions: true | AccessControlPermissions) => ({
    async resolve({ request }: { request: Request }) {
      const auth = getAuthInstance(request);
      const authSession = await resolveAuthorization({
        permissions,
        getSession: () => auth.api.getSession({ headers: request.headers }),
        userHasPermission: async (userId, requestedPermissions) => {
          const result = await auth.api.userHasPermission({
            body: { userId, permissions: requestedPermissions },
          });
          return result.success;
        },
      });

      return {
        user: authSession.user,
        session: authSession.session,
      };
    },
  }),
});
