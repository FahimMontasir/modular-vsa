import { drizzle } from "drizzle-orm/bun-sql";

import { env } from "@modular-vsa/env/server";

import * as auth from "./schema/auth";
import * as home from "./schema/home";

const schema = {
  ...auth,
  ...home,
};

export function createDb() {
  return drizzle(env.DATABASE_URL, {
    schema,
  });
}

export const db = createDb();
