import { treaty } from "@elysiajs/eden";

import { ensureBootstrapAdmin } from "@modular-vsa/auth/server/bootstrap-admin";
import { authHandler, getAuthInstance } from "@modular-vsa/auth/server/index";
import { env } from "@modular-vsa/env/server";

import { NotificationRoutes } from "../../../src/server/controllers/routes";

function cookieHeader(response: Response) {
  const cookies = response.headers.getSetCookie().map((value) => value.split(";", 1)[0]);
  if (!cookies.length) throw new Error("Better Auth did not return a session cookie");
  return cookies.join("; ");
}

export async function createAuthenticatedNotificationClient() {
  await ensureBootstrapAdmin();
  const response = await authHandler(
    new Request(new URL("/api/auth/sign-in/username", env.BETTER_AUTH_URL), {
      method: "POST",
      headers: { "content-type": "application/json", origin: env.CORS_ORIGIN },
      body: JSON.stringify({
        username: env.BOOTSTRAP_ADMIN_USERNAME,
        password: env.BOOTSTRAP_ADMIN_PASSWORD,
      }),
    })
  );
  if (!response.ok) throw new Error(`Bootstrap administrator login failed (${response.status})`);

  const headers = { cookie: cookieHeader(response), origin: env.CORS_ORIGIN };
  const session = await getAuthInstance(
    new Request(env.BETTER_AUTH_URL, { headers })
  ).api.getSession({ headers: new Headers(headers) });
  if (!session || session.user.role !== "admin")
    throw new Error("Notification route tests require the bootstrap administrator");

  return { api: treaty(NotificationRoutes, { headers }), user: session.user };
}
