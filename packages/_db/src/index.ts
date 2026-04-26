import { drizzle } from "drizzle-orm/node-postgres";

import { env } from "@modular-vsa/env/server";

import * as auth from "./schema/auth";

export function createDb() {
  return drizzle(env.DATABASE_URL, {
    schema: {
      ...auth,
    },
  });
}

export const db = createDb();
