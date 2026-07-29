type AuthNotification = {
  source: "account" | "security";
  title: string;
  body: string;
  recipientIds: string[];
  actionUrl?: string;
};

let publisher: ((notification: AuthNotification) => Promise<unknown>) | undefined;

export function registerAuthNotificationPublisher(next: typeof publisher) {
  publisher = next;
}

export async function publishAuthNotification(notification: AuthNotification) {
  try {
    await publisher?.(notification);
  } catch {
    // Authentication must remain available when notification delivery infrastructure is offline.
  }
}
