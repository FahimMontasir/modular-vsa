import { initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";

import { env } from "@modular-vsa/env/web";

let app: FirebaseApp | null = null;

/**
 * Returns the Firebase web app configuration read from environment variables.
 *
 * All values are sourced from `VITE_FIREBASE_*` env vars validated by `@modular-vsa/env`. The
 * returned object can be used with `initializeApp()` or to configure other Firebase services.
 *
 * @see https://firebase.google.com/docs/web/setup#config-object
 */
export function getFirebaseConfig(): FirebaseOptions {
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
  };
}

/**
 * Returns the singleton Firebase web app, initializing it on first call.
 *
 * Safe to call repeatedly — subsequent invocations return the same instance. Uses the config from
 * {@link getFirebaseConfig}.
 *
 * @see https://firebase.google.com/docs/web/setup#initialize-sdk
 */
export function getApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(getFirebaseConfig());
  }
  return app;
}
