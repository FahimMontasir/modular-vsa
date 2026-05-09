import { openapi } from "@elysia/openapi";
import { serverTiming } from "@elysia/server-timing";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { authHandler } from "@modular-vsa/auth";
import { env } from "@modular-vsa/env/server";
import { startAllWorkers } from "@modular-vsa/jobs";

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
  .all("/api/auth/*", async (context) => authHandler(context))
  .use(APIV1)
  .listen(env.PORT, () => {
    startAllWorkers().catch((err: unknown) => {
      console.error("Background workers failed to start:", err);
      process.exit(1);
    });
    console.log(`Server is running on http://localhost:${env.PORT}`);
  });
