import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { env } from "@modular-vsa/env/server";

let adminApp: App | null = null;

function runtimeServiceAccount(): ServiceAccount | undefined {
  const configuredPath = env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const developmentPaths =
    env.NODE_ENV === "development"
      ? ["packages/_firebase/service-key.json", "../../packages/_firebase/service-key.json"]
      : [];
  const path = [configuredPath, ...developmentPaths]
    .filter((value): value is string => Boolean(value))
    .map((value) => resolve(process.cwd(), value))
    .find(existsSync);
  if (!path) return undefined;
  return JSON.parse(readFileSync(path, "utf8")) as ServiceAccount;
}

/**
 * Returns the singleton Firebase Admin app instance, initializing it on first call.
 *
 * Initialisation priority:
 *
 * 1. If an app was already created (e.g. by another module), return it.
 * 2. Use explicit `FIREBASE_PRIVATE_KEY` / `FIREBASE_CLIENT_EMAIL` env vars.
 * 3. Load a runtime-only credential file when explicitly configured (or in local development).
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

  const serviceAccount = runtimeServiceAccount();
  if (env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL) {
    adminApp = initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  } else if (serviceAccount) {
    adminApp = initializeApp({ credential: cert(serviceAccount) });
  } else {
    adminApp = initializeApp();
  }

  return adminApp;
}
