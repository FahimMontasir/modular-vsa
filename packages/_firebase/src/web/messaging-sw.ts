import { getMessaging, isSupported, onBackgroundMessage } from "firebase/messaging/sw";

import { getApp } from "./init";
import {
  firebaseNotificationPresentation,
  safeNotificationDestination,
} from "./notification-payload";

type NotificationClickEvent = Event & {
  notification: Notification;
  waitUntil: (promise: Promise<unknown>) => void;
};

type MessagingServiceWorker = typeof globalThis & {
  registration: ServiceWorkerRegistration;
  location: Location;
  clients: {
    matchAll: (options: { includeUncontrolled: boolean; type: "window" }) => Promise<
      Array<{
        url: string;
        focus: () => Promise<unknown>;
        navigate: (url: string) => Promise<unknown>;
      }>
    >;
    openWindow: (url: string) => Promise<unknown>;
  };
};

const serviceWorker = globalThis as MessagingServiceWorker;

export async function initializeBackgroundMessaging() {
  try {
    if (!(await isSupported())) return;

    const messaging = getMessaging(getApp());
    return onBackgroundMessage(messaging, (payload) => {
      const notification = firebaseNotificationPresentation(payload.data);
      void serviceWorker.registration.showNotification(notification.title, notification.options);
    });
  } catch {
    // Messaging is optional in service-worker contexts that lack the required APIs.
  }
}

async function openNotificationDestination(destination: string) {
  const windows = await serviceWorker.clients.matchAll({
    includeUncontrolled: true,
    type: "window",
  });
  const existing = windows.find(({ url }) => new URL(url).origin === serviceWorker.location.origin);
  if (existing) {
    await existing.navigate(destination);
    await existing.focus();
    return;
  }
  await serviceWorker.clients.openWindow(destination);
}

globalThis.addEventListener("notificationclick", (event) => {
  const notificationEvent = event as NotificationClickEvent;
  notificationEvent.notification.close();
  const destination = safeNotificationDestination(notificationEvent.notification.data?.destination);
  notificationEvent.waitUntil(openNotificationDestination(destination));
});
