import type { QueryClient } from "@tanstack/react-query";

import {
  isMessagingSupported,
  onForegroundMessage,
  requestFcmToken,
} from "@modular-vsa/firebase/web/messaging";
import { trackEvent } from "@modular-vsa/firebase/web/telemetry";

import { notificationApi, notificationKeys } from "./api/query";

const FID_KEY = "modular-vsa-notification-fid";

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
    const registration = await navigator.serviceWorker.ready;
    const fid = await requestFcmToken({ serviceWorkerRegistration: registration });
    const registrationResult = await notificationApi.notification.devices.put({
      fid,
      platform: "web",
      userAgent: navigator.userAgent,
    });
    if (registrationResult.error || !registrationResult.data)
      throw new Error("Firebase device registration could not be persisted");
    localStorage.setItem(FID_KEY, fid);
    return "granted";
  } catch {
    return "error";
  }
}

export async function detachCurrentDevice() {
  const fid = localStorage.getItem(FID_KEY);
  if (!fid) return;
  await notificationApi.notification.devices.delete({ fid, platform: "web" });
  localStorage.removeItem(FID_KEY);
}

export function listenForFirebaseMessages(queryClient: QueryClient) {
  return onForegroundMessage((payload) => {
    const conversationId = payload.data?.conversationId;
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread }),
      queryClient.invalidateQueries({ queryKey: notificationKeys.conversations }),
      conversationId
        ? queryClient.invalidateQueries({
            queryKey: notificationKeys.messagePages(conversationId),
          })
        : Promise.resolve(),
    ]);
  });
}

export function reconcileNotificationQueries(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: notificationKeys.unread }),
    queryClient.invalidateQueries({ queryKey: notificationKeys.conversations }),
  ]);
}
