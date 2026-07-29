import { treaty } from "@elysiajs/eden";

import { ensureBootstrapAdmin } from "@modular-vsa/auth/server/bootstrap-admin";
import { authHandler, getAuthInstance } from "@modular-vsa/auth/server/index";
import { env } from "@modular-vsa/env/server";

import { HomeRoutes } from "../../../src/server/controllers/routes";

function cookieHeader(response: Response) {
  const cookies = response.headers.getSetCookie().map((value) => value.split(";", 1)[0]);

  if (cookies.length === 0) throw new Error("Better Auth did not return a session cookie");

  return cookies.join("; ");
}

export async function createAuthenticatedHomeClient() {
  await ensureBootstrapAdmin();

  const response = await authHandler(
    new Request(new URL("/api/auth/sign-in/username", env.BETTER_AUTH_URL), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: env.CORS_ORIGIN,
      },
      body: JSON.stringify({
        username: env.BOOTSTRAP_ADMIN_USERNAME,
        password: env.BOOTSTRAP_ADMIN_PASSWORD,
      }),
    })
  );

  if (!response.ok) {
    throw new Error(
      `Bootstrap administrator login failed (${response.status}): ${await response.text()}`
    );
  }

  const headers = {
    cookie: cookieHeader(response),
    origin: env.CORS_ORIGIN,
  };
  const session = await getAuthInstance(
    new Request(env.BETTER_AUTH_URL, { headers })
  ).api.getSession({ headers: new Headers(headers) });

  if (!session || session.user.role !== "admin") {
    throw new Error("Bootstrap administrator login did not produce an administrator session");
  }

  return treaty(HomeRoutes, { headers });
}
