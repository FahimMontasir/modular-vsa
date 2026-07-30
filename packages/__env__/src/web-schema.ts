import { t } from "elysia";

function nonEmptyString() {
  return t.String({ minLength: 1 });
}

export const WebEnvSchema = t.Object({
  VITE_SERVER_URL: t.String({ format: "uri" }),
  VITE_FIREBASE_API_KEY: nonEmptyString(),
  VITE_FIREBASE_AUTH_DOMAIN: nonEmptyString(),
  VITE_FIREBASE_PROJECT_ID: nonEmptyString(),
  VITE_FIREBASE_STORAGE_BUCKET: nonEmptyString(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: nonEmptyString(),
  VITE_FIREBASE_APP_ID: nonEmptyString(),
  VITE_FIREBASE_MEASUREMENT_ID: t.Optional(nonEmptyString()),
  VITE_FIREBASE_VAPID_KEY: nonEmptyString(),
});

export type WebEnv = typeof WebEnvSchema.static;
