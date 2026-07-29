import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { ensureBootstrapAdmin } from "@modular-vsa/auth/server/bootstrap-admin";
import { authHandler } from "@modular-vsa/auth/server/index";
import { env } from "@modular-vsa/env/server";
import { startAllWorkers } from "@modular-vsa/jobs";
import { logger } from "@modular-vsa/shared/common/logger";

import { CORS_CONFIG } from "./utils/cors";
import { GlobalErrorHandler } from "./utils/globalError";
import { serverMonitoring } from "./utils/monitoring";
import { APIV1 } from "./v1-routes";

await ensureBootstrapAdmin();

export const app = new Elysia()
  .use(serverMonitoring)
  .use(GlobalErrorHandler)
  .use(cors(CORS_CONFIG))
  .all("/api/auth/*", ({ request }) => authHandler(request), { parse: "none" })
  .use(APIV1)
  .listen(env.PORT, () => {
    startAllWorkers().catch((err) => {
      logger.error("[Jobs] Background workers failed to start:", err);
      process.exit(1);
    });
    const storageDashboard =
      env.GARAGE_WEBUI_HOST && env.GARAGE_WEBUI_PORT
        ? `http://${env.GARAGE_WEBUI_HOST}:${env.GARAGE_WEBUI_PORT}`
        : "not configured";
    const storageLogin =
      env.GARAGE_WEBUI_USERNAME && env.GARAGE_WEBUI_PASSWORD
        ? `${env.GARAGE_WEBUI_USERNAME} / ${env.GARAGE_WEBUI_PASSWORD}`
        : "not configured";

    logger.info(
      `\n\x1b[36m🚀 Server:\x1b[0m http://localhost:${env.PORT}` +
        `\n\x1b[36m📚 API docs:\x1b[0m http://localhost:${env.PORT}/api-docs` +
        `\n\x1b[36m🔐 Auth docs:\x1b[0m http://localhost:${env.PORT}/api/auth/reference` +
        `\n\x1b[36m🗄️ Drizzle Studio:\x1b[0m ${env.DRIZZLE_STUDIO_URL ?? "not configured"}` +
        `\n\x1b[36m📦 Storage dashboard:\x1b[0m ${storageDashboard}` +
        `\n\x1b[36m🔑 Storage login:\x1b[0m ${storageLogin}` +
        `\n\x1b[36m🧪 Unit tests:\x1b[0m bun run test:unit` +
        `\n\x1b[36m🧪 Integration tests:\x1b[0m bun run test:integration` +
        `\n\x1b[36m🧪 End-to-end tests:\x1b[0m bun run test:e2e` +
        `\n\x1b[36m🧪 Complete test suite:\x1b[0m bun run test:all` +
        `\n\x1b[36m🎭 Playwright UI:\x1b[0m npm --prefix tests run test:ui` +
        `\n\x1b[36m🎭 Playwright debug:\x1b[0m npm --prefix tests run test:debug` +
        `\n\x1b[36m🎭 Playwright report:\x1b[0m npm --prefix tests run test:show-report`
    );
  });
