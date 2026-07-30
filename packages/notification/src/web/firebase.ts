import type { QueryClient } from "@tanstack/react-query";

import {
  isMessagingSupported,
  onForegroundMessage,
  onRegistered,
  onUnregistered,
  registerFcmInstallation,
  unregisterFcmInstallation,
} from "@modular-vsa/firebase/web/messaging";
import { firebaseNotificationPresentation } from "@modular-vsa/firebase/web/notification-payload";
import { trackEvent } from "@modular-vsa/firebase/web/telemetry";
import { toast } from "@modular-vsa/ui/toast";

import { notificationApi, notificationKeys } from "./api/query";
import { replacedFirebaseRegistration } from "./helpers/firebase-registration";

const FID_KEY = "modular-vsa-notification-fid";
const fidSyncs = new Map<string, Promise<void>>();
let registrationPromise: Promise<void> | undefined;

export type PermissionState = NotificationPermission | "unsupported" | "registering" | "error";

export async function notificationPermissionState(): Promise<PermissionState> {
  if (!(await isMessagingSupported())) return "unsupported";
  return Notification.permission;
}

export async function enableNotifications(): Promise<PermissionState> {
  if (!(await isMessagingSupported())) return "unsupported";
  const permission = await Notification.requestPermission();
  await trackEvent("notification_permission", { outcome: permission });
  if (permission !== "granted") return permission;
  try {
    await ensureFirebaseRegistration();
    return "granted";
  } catch {
    return "error";
  }
}

export async function detachCurrentDevice() {
  const fid = localStorage.getItem(FID_KEY);
  const results = await Promise.allSettled([
    fid ? detachFirebaseRegistration(fid) : Promise.resolve(),
    unregisterFcmInstallation(),
  ]);
  localStorage.removeItem(FID_KEY);
  const failure = results.find(({ status }) => status === "rejected");
  if (failure?.status === "rejected") throw failure.reason;
}

export async function startFirebaseNotificationRuntime(queryClient: QueryClient) {
  // eslint-disable-next-line no-console
  console.info("[Notification] Starting Firebase runtime...");
  if (!(await isMessagingSupported())) {
    // eslint-disable-next-line no-console
    console.warn("[Notification] Messaging is not supported on this browser.");
    return () => undefined;
  }
  const registration = await navigator.serviceWorker.ready;
  const stopRegistered = onRegistered((fid) => {
    // eslint-disable-next-line no-console
    console.log("[Notification] Device registered with FID:", fid);
    void syncFirebaseRegistration(fid).catch(() => undefined);
  });
  const stopUnregistered = onUnregistered((fid) => {
    // eslint-disable-next-line no-console
    console.log("[Notification] Device unregistered:", fid);
    void detachFirebaseRegistration(fid).catch(() => undefined);
  });
  if (Notification.permission === "granted") {
    // eslint-disable-next-line no-console
    console.info("[Notification] Permission granted, ensuring registration.");
    await ensureFirebaseRegistration(registration).catch(() => undefined);
  } else {
    // eslint-disable-next-line no-console
    console.warn("[Notification] Permission state:", Notification.permission);
  }
  const stopMessages = listenForFirebaseMessages(queryClient, registration);
  return () => {
    stopRegistered();
    stopUnregistered();
    stopMessages();
  };
}

function listenForFirebaseMessages(
  queryClient: QueryClient,
  registration: ServiceWorkerRegistration
) {
  function handler(payload: { data?: any }) {
    // eslint-disable-next-line no-console
    console.log("[Notification] Foreground message received", payload);
    const conversationId = payload.data?.conversationId;
    const notification = firebaseNotificationPresentation(payload.data);
    if (Notification.permission === "granted") {
      void registration.showNotification(notification.title, notification.options).catch((err) => {
        // eslint-disable-next-line no-console
        console.warn("[Notification] Popup unavailable:", err);
      });
    }
    toast(notification.title, { description: notification.options.body });
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread }),
      queryClient.invalidateQueries({ queryKey: notificationKeys.conversations }),
      conversationId
        ? queryClient.invalidateQueries({
            queryKey: notificationKeys.messagePages(conversationId),
          })
        : Promise.resolve(),
    ]);
  }

  if (import.meta.env.DEV || import.meta.env.MODE === "test") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__simulateFirebaseMessage = handler;
  }

  return onForegroundMessage(handler);
}

async function ensureFirebaseRegistration(registration?: ServiceWorkerRegistration) {
  if (registrationPromise) return registrationPromise;
  registrationPromise = (async () => {
    const serviceWorkerRegistration = registration ?? (await navigator.serviceWorker.ready);
    const fid = await registerFcmInstallation({ serviceWorkerRegistration });
    await syncFirebaseRegistration(fid);
  })();
  try {
    await registrationPromise;
  } finally {
    registrationPromise = undefined;
  }
}

function syncFirebaseRegistration(fid: string) {
  const existing = fidSyncs.get(fid);
  if (existing) return existing;
  const sync = (async () => {
    const registrationResult = await notificationApi.notification.devices.put({
      fid,
      platform: "web",
      userAgent: navigator.userAgent,
    });
    if (registrationResult.error || !registrationResult.data)
      throw new Error("Firebase device registration could not be persisted");
    const previousFid = localStorage.getItem(FID_KEY);
    localStorage.setItem(FID_KEY, fid);
    const replacedFid = replacedFirebaseRegistration(previousFid, fid);
    if (replacedFid) await detachFirebaseRegistration(replacedFid);
  })();
  fidSyncs.set(fid, sync);
  void sync.then(
    () => fidSyncs.delete(fid),
    () => fidSyncs.delete(fid)
  );
  return sync;
}

async function detachFirebaseRegistration(fid: string) {
  const result = await notificationApi.notification.devices.delete({ fid, platform: "web" });
  if (result.error || !result.data)
    throw new Error("Firebase device registration could not be detached");
  if (localStorage.getItem(FID_KEY) === fid) localStorage.removeItem(FID_KEY);
}

export function reconcileNotificationQueries(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: notificationKeys.unread }),
    queryClient.invalidateQueries({ queryKey: notificationKeys.conversations }),
  ]);
}
