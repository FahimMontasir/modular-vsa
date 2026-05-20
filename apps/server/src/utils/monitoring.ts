import { openapi } from "@elysia/openapi";
import { serverTiming } from "@elysia/server-timing";
import { Elysia } from "elysia";

export const serverMonitoring = new Elysia().use(serverTiming()).use(
  openapi({
    path: "/api-docs",
    documentation: {
      info: {
        title: "ModularVSA API",
        description: "API documentation for ModularVSA backend server",
        version: "1.0.0",
      },
    },
  })
);
