export type FirebaseNotificationData = Record<string, string> | undefined;

export function safeNotificationDestination(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function firebaseNotificationPresentation(data: FirebaseNotificationData) {
  return {
    title: data?.pushTitle ?? "New notification",
    options: {
      body: data?.pushBody ?? "Open the portal to view this update.",
      icon: "/favicon.svg",
      data: { destination: safeNotificationDestination(data?.destination) },
    } satisfies NotificationOptions,
  };
}
