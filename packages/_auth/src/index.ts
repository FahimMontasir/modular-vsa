import { expo } from "@better-auth/expo";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Context } from "elysia";

import { db } from "@modular-vsa/db";
import * as schema from "@modular-vsa/db/schema/auth";
import { env } from "@modular-vsa/env/server";

export const AUTH_ACCEPT_METHODS = ["POST", "GET"];

function createAuthConfig(appName: string): BetterAuthOptions {
  return {
    telemetry: { enabled: false },
    appName,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: schema,
    }),
    trustedOrigins: [
      env.CORS_ORIGIN,
      "modular-vsa://",
      ...(env.NODE_ENV === "development"
        ? ["exp://", "exp://**", "exp://192.168.*.*:*/**", "http://localhost:8081"]
        : []),
    ],
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      cookiePrefix: appName,
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    plugins: [expo()],
  };
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
export async function authHandler(ctx: Context) {
  if (AUTH_ACCEPT_METHODS.includes(ctx.request.method)) {
    return getAuthInstance(ctx.request).handler(ctx.request);
  }

  return ctx.status(405);
}
