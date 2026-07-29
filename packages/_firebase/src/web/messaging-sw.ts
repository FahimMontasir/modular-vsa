import { getMessaging, isSupported, onBackgroundMessage } from "firebase/messaging/sw";

import { getApp } from "./init";

type NotificationClickEvent = Event & {
  notification: Notification;
  waitUntil: (promise: Promise<unknown>) => void;
};

type MessagingServiceWorker = typeof globalThis & {
  registration: ServiceWorkerRegistration;
  clients: { openWindow: (url: string) => Promise<unknown> };
};

const serviceWorker = globalThis as MessagingServiceWorker;

export async function initializeBackgroundMessaging() {
  try {
    if (!(await isSupported())) return;

    const messaging = getMessaging(getApp());
    return onBackgroundMessage(messaging, (payload) => {
      const data = payload.data ?? {};
      void serviceWorker.registration.showNotification(data.pushTitle ?? "New notification", {
        body: data.pushBody ?? "Open the portal to view this update.",
        icon: "/favicon.svg",
        data: { destination: safeDestination(data.destination) },
      });
    });
  } catch {
    // Messaging is optional in service-worker contexts that lack the required APIs.
  }
}

function safeDestination(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

globalThis.addEventListener("notificationclick", (event) => {
  const notificationEvent = event as NotificationClickEvent;
  notificationEvent.notification.close();
  const destination = safeDestination(notificationEvent.notification.data?.destination);
  notificationEvent.waitUntil(serviceWorker.clients.openWindow(destination));
});
