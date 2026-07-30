import {
  getMessaging as _getMessaging,
  register as _register,
  onRegistered as _onRegistered,
  onMessage as _onMessage,
  onUnregistered as _onUnregistered,
  unregister as _unregister,
  isSupported,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";

import { env } from "@modular-vsa/env/web";

import { getApp } from "./init";

let messaging: Messaging | null = null;

export async function isMessagingSupported(): Promise<boolean> {
  return isSupported();
}

/**
 * Returns the singleton Firebase Messaging instance, initializing it on first call.
 *
 * @see https://firebase.google.com/docs/cloud-messaging
 */
export function getMessaging(): Messaging {
  if (!messaging) {
    messaging = _getMessaging(getApp());
  }
  return messaging;
}

/**
 * Registers the app with FCM using the FID-based registration API.
 *
 * Handles notification permission, VAPID key setup, and service worker registration. Resolves with
 * the Firebase Installation ID (FID) which can be used to target this device via FCM.
 *
 * This replaces the deprecated `getToken()` API. Use `onRegistered()` if you need to observe the
 * FID before the promise resolves.
 *
 * @param options - Optional VAPID key and service worker registration overrides.
 * @returns The Firebase Installation ID (FID).
 * @see https://firebase.google.com/docs/cloud-messaging/js/client#register
 */
export async function registerFcmInstallation(options?: {
  vapidKey?: string;
  serviceWorkerRegistration?: ServiceWorkerRegistration;
}): Promise<string> {
  const instance = getMessaging();
  const vapidKey = options?.vapidKey ?? env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) throw new Error("Firebase web push requires a VAPID key");

  const fid = await new Promise<string>((resolve, reject) => {
    const unsub = _onRegistered(instance, (fid) => {
      unsub();
      resolve(fid);
    });

    _register(instance, {
      vapidKey,
      serviceWorkerRegistration: options?.serviceWorkerRegistration,
    }).catch((err) => {
      unsub();
      reject(err);
    });
  });

  return fid;
}

/**
 * Registers a callback invoked when FCM registration completes.
 *
 * Must be called **before** `register()` (or {@link requestFcmToken}) to receive the callback. The
 * callback receives the Firebase Installation ID.
 *
 * @param callback - Function called with the FID on successful registration.
 * @returns An unsubscribe function.
 * @see https://firebase.google.com/docs/cloud-messaging/js/client#onregistered
 */
export function onRegistered(callback: (fid: string) => void): () => void {
  return _onRegistered(getMessaging(), callback);
}

/**
 * Unregisters the app instance from FCM.
 *
 * Deletes the FID-based registration on the server and clears local metadata. Triggers
 * `onUnregistered()` with the removed FID on success.
 *
 * @see https://firebase.google.com/docs/cloud-messaging/js/client#unregister
 */
export async function unregisterFcmInstallation(): Promise<void> {
  return _unregister(getMessaging());
}

/**
 * Registers a callback invoked when the FCM registration is deleted.
 *
 * @param callback - Function called with the unregistered FID.
 * @returns An unsubscribe function.
 * @see https://firebase.google.com/docs/cloud-messaging/js/client#onunregistered
 */
export function onUnregistered(callback: (fid: string) => void): () => void {
  return _onUnregistered(getMessaging(), callback);
}

/**
 * Listens for incoming FCM messages while the app is in the foreground.
 *
 * @param callback - Function called with each received message payload.
 * @returns An unsubscribe function.
 * @see https://firebase.google.com/docs/cloud-messaging/js/receive#handle_messages_when_your_app_is_in_the_foreground
 */
export function onForegroundMessage(callback: (payload: MessagePayload) => void): () => void {
  return _onMessage(getMessaging(), callback);
}
