import { cert, getApps, initializeApp, type App } from "firebase-admin/app";

import { env } from "@modular-vsa/env/server";

let serviceAccount: Record<string, string> | undefined;

try {
  // Dynamic import so the module loads even when service-key.json is absent
  // (e.g. CI, fresh clone). Expected to be present or FIREBASE_PRIVATE_KEY
  // env var should be set in production.
  const serviceAccountPath = "../../service-key.json";
  const mod = await import(serviceAccountPath, { with: { type: "json" } });
  serviceAccount = mod.default ?? mod;
} catch {
  serviceAccount = undefined;
}

let adminApp: App | null = null;

/**
 * Returns the singleton Firebase Admin app instance, initializing it on first call.
 *
 * Initialisation priority:
 *
 * 1. If an app was already created (e.g. by another module), return it.
 * 2. If `service-key.json` exists at the package root, use it.
 * 3. Fall back to `FIREBASE_PRIVATE_KEY` / `FIREBASE_CLIENT_EMAIL` env vars.
 * 4. Initialise with default application credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS).
 *
 * @see https://firebase.google.com/docs/admin/setup
 */
export function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existing = getApps()[0];
  if (existing) {
    adminApp = existing;
    return adminApp;
  }

  if (serviceAccount) {
    adminApp = initializeApp({
      credential: cert(serviceAccount as any),
    });
  } else if (env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL) {
    adminApp = initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    adminApp = initializeApp();
  }

  return adminApp;
}
