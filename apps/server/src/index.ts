import { openapi } from "@elysia/openapi";
import { serverTiming } from "@elysia/server-timing";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { auth } from "@modular-vsa/auth";
import { env } from "@modular-vsa/env/server";

import { CORS_CONFIG } from "./utils/cors";
import { GlobalErrorHandler } from "./utils/globalError";
import { APIV1 } from "./v1-routes";

export const app = new Elysia()
  .use(GlobalErrorHandler)
  .use(serverTiming())
  .use(
    openapi({
      path: "/api-docs",
      // references: fromTypes(),
    })
  )
  .use(cors(CORS_CONFIG))
  .all("/api/auth/*", async (context) => {
    const { request, status } = context;
    if (["POST", "GET"].includes(request.method)) {
      return auth.handler(request);
    }
    return status(405);
  })
  .use(APIV1)
  .listen(env.PORT, () => {
    console.log(`Server is running on http://localhost:${env.PORT}`);
  });

export const ServerType = typeof app;
