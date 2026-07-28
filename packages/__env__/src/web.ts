import { parseEnv } from "./parse";
import { WebEnvSchema } from "./web-schema";

export { WebEnvSchema, type WebEnv } from "./web-schema";

export const env = parseEnv(WebEnvSchema, (import.meta as any).env);
