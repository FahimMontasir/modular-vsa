import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_SERVER_URL: z.url(),
    EXPO_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
    EXPO_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
    EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
    EXPO_PUBLIC_FIREBASE_VAPID_KEY: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
