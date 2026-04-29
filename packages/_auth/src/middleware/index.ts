import { Elysia } from "elysia";

import { auth } from "..";

/**
 * Auth middleware
 *
 * This middleware is used to authenticate the user
 *
 * @example
 *   ```ts
 *   import { AuthMiddleware } from "@kuno/api/v1/middlewares/auth";
 *
 *   const app = secureAPI().get(
 *     "/",
 *     ({ user, session }) => {
 *       return user;
 *     },
 *     { authenticate: true }
 *   );
 *   ```;
 */
export const AuthMiddleware = new Elysia({
  name: "Auth Middleware",
  detail: { tags: ["Better Auth Middleware"] },
}).macro({
  // INFO: can pass role or array of roles as a parameter to the middleware
  authenticate: {
    // INFO: resolve is a hook that is called after the validation is processed
    async resolve({ request }) {
      const authSession = await auth.api.getSession({
        headers: request.headers,
      });

      if (!authSession) {
        throw new Error("Unauthorized");
      }

      return {
        user: authSession.user,
        session: authSession.session,
      };
    },
  },
});
