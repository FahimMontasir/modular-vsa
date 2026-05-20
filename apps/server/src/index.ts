import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { authHandler } from "@modular-vsa/auth/server/index";
import { env } from "@modular-vsa/env/server";
import { startAllWorkers } from "@modular-vsa/jobs";
import { logger } from "@modular-vsa/shared/common/logger";

import { CORS_CONFIG } from "./utils/cors";
import { GlobalErrorHandler } from "./utils/globalError";
import { serverMonitoring } from "./utils/monitoring";
import { APIV1 } from "./v1-routes";

export const app = new Elysia()
  .use(serverMonitoring)
  .use(GlobalErrorHandler)
  .use(cors(CORS_CONFIG))
  .all("/api/auth/*", async (context) => authHandler(context))
  .use(APIV1)
  .listen(env.PORT, () => {
    startAllWorkers().catch((err) => {
      logger.error("[Jobs] Background workers failed to start:", err);
      process.exit(1);
    });
    logger.info(
      `\n\x1b[36m🚀 Server:\x1b[0m http://localhost:${env.PORT}\n\x1b[36m📚 Docs:\x1b[0m http://localhost:${env.PORT}/api-docs\n\x1b[35m💡 Tips:\x1b[0m u/d scroll • t/b jump • c copy (not cmd+c)\n`
    );
  });
