import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import { admin as adminPlugin } from "better-auth/plugins/admin";
import { username } from "better-auth/plugins/username";
import { redis } from "bun";

import { db } from "@modular-vsa/db";
import * as schema from "@modular-vsa/db/schema/auth";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@modular-vsa/env/auth-policy";
import { env } from "@modular-vsa/env/server";

import { ac, roles } from "../access-control";
import { publishAuthNotification } from "./notification-hooks";

export const AUTH_ACCEPT_METHODS = ["POST", "GET"];

function createAuthConfig(appName: string) {
  const isProduction = env.NODE_ENV === "production";

  return {
    telemetry: { enabled: false },
    appName,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN],
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
    },
    user: {
      changeEmail: {
        enabled: true,
        updateEmailWithoutVerification: true,
      },
      deleteUser: {
        enabled: true,
      },
    },
    plugins: [
      adminPlugin({ ac, roles, defaultRole: "director" }),
      username({ minUsernameLength: 3, maxUsernameLength: 30 }),
      openAPI(),
    ],
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      cookiePrefix: appName,
      defaultCookieAttributes: {
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        httpOnly: true,
      },
    },
    secondaryStorage: {
      get: async (key) => await redis.get(key),

      set: async (key, value, ttl) => {
        if (ttl) await redis.set(key, value, "EX", ttl);
        else await redis.set(key, value);
      },

      delete: async (key) => {
        await redis.del(key);
      },
    },
    databaseHooks: {
      user: {
        update: {
          after: async (updatedUser) =>
            publishAuthNotification({
              source: "account",
              title: "Account updated",
              body: "Your account details were updated.",
              recipientIds: [updatedUser.id],
              actionUrl: "/account/profile",
            }),
        },
      },
      session: {
        create: {
          after: async (createdSession) =>
            publishAuthNotification({
              source: "security",
              title: "New sign-in",
              body: "A new session was created for your account.",
              recipientIds: [createdSession.userId],
              actionUrl: "/account/sessions",
            }),
        },
        delete: {
          after: async (deletedSession) =>
            publishAuthNotification({
              source: "security",
              title: "Session ended",
              body: "A session was removed from your account.",
              recipientIds: [deletedSession.userId],
              actionUrl: "/account/sessions",
            }),
        },
      },
      account: {
        create: {
          after: async (createdAccount) =>
            publishAuthNotification({
              source: "account",
              title: "Account connected",
              body: "A sign-in method was connected to your account.",
              recipientIds: [createdAccount.userId],
              actionUrl: "/account/connections",
            }),
        },
        delete: {
          after: async (deletedAccount) =>
            publishAuthNotification({
              source: "account",
              title: "Account disconnected",
              body: "A sign-in method was removed from your account.",
              recipientIds: [deletedAccount.userId],
              actionUrl: "/account/connections",
            }),
        },
      },
    },
    rateLimit: {
      enabled: true,
      storage: "secondary-storage",
    },
  } satisfies BetterAuthOptions;
}

/**
 * Create a new auth instance
 *
 * @param appName - The name of the app
 * @returns A new auth instance
 */
export function createAuthInstance(appName: string) {
  return betterAuth(createAuthConfig(appName));
}

export const appInstance = createAuthInstance(
  env.NODE_ENV === "production" ? env.APP_NAME : `${env.APP_NAME}-dev`
);
export const dashboardInstance = createAuthInstance(
  env.NODE_ENV === "production" ? env.DASHBOARD_APP_NAME : `${env.DASHBOARD_APP_NAME}-dev`
);

/**
 * Get the auth instance based on the request
 *
 * @param request - The request object
 * @returns The auth instance
 */
export function getAuthInstance(request: Request) {
  const origin = request.headers.get("Origin");
  const isDashboard = origin?.includes("dashboard") || origin?.includes("localhost:6000");
  return isDashboard ? dashboardInstance : appInstance;
}

/**
 * Auth handler
 *
 * This is the handler for the auth routes
 */
export async function authHandler(request: Request) {
  if (AUTH_ACCEPT_METHODS.includes(request.method)) {
    return getAuthInstance(request).handler(request);
  }

  return new Response(null, { status: 405 });
}
