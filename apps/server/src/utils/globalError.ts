import Elysia, { status } from "elysia";

import { env } from "@modular-vsa/env/server";
import { ApiError } from "@modular-vsa/utils/server/apiError";

export const GlobalErrorHandler = new Elysia()
  /** Register custom UserError type */
  .error({
    ApiError,
  })
  /** Capture all unhandled exceptions and errors */
  .onError({ as: "global" }, function captureException(ctx) {
    switch (ctx.code) {
      case "ApiError": {
        if (env.NODE_ENV === "development") {
          console.error("[API ERROR] ", ctx.error);
        }

        // Send to monitoring service if flagged
        if (env.NODE_ENV !== "development" && ctx.error.monitor) {
          // TODO: monitor error logging in production and ensure that it is working as expected
        }

        return status(ctx.error.statusCode, ctx.error.message);
      }

      case "VALIDATION": {
        if (env.NODE_ENV === "development") {
          console.error(
            "[VALIDATION ERROR] ",
            ctx.error.all.find((e) => e.summary)
          );
        }

        return status("Unprocessable Content", ctx.error.all.find((e) => e.summary)?.summary);
      }

      case "NOT_FOUND": {
        if (env.NODE_ENV === "development") {
          console.error("[NOT_FOUND ERROR] ", ctx.error);
        }
        return status("Not Found", `${ctx.request.method}: Route Not Found (${ctx.path})`);
      }

      default: {
        // Handle other unhandled errors
        // if (env.NODE_ENV === "development") {
        console.error("[GLOBAL ERROR] ", {
          code: ctx.code,
          path: ctx.path,
          error: ctx.error,
        });
        // }
        if (env.NODE_ENV !== "development") {
          if ("user" in ctx && ctx.user) {
            // TODO: monitor error logging in production and ensure that it is working as expected
          }
        }

        return status("Internal Server Error");
      }
    }
  });
