import type { Static, TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

/** Treat empty dotenv values as missing before validating required and optional fields. */
export function normalizeEnv(source: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== "" && value !== undefined)
  );
}

/** Parse an environment object with an Elysia `t` schema. */
export function parseEnv<const Schema extends TSchema>(
  schema: Schema,
  source: Record<string, unknown>
): Static<Schema> {
  return Value.Parse(schema, normalizeEnv(source)) as Static<Schema>;
}
