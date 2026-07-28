import { parseEnv } from "./parse";
import { ServerEnvSchema } from "./server-schema";

export { ServerEnvSchema, type ServerEnv } from "./server-schema";

export const env = parseEnv(ServerEnvSchema, Bun.env);
