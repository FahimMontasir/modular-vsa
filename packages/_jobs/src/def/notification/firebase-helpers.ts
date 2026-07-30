const TRANSIENT_CODES = new Set([
  "messaging/internal-error",
  "messaging/server-unavailable",
  "messaging/unknown-error",
  "messaging/quota-exceeded",
]);

const INVALID_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
  "messaging/installation-id-not-registered",
  "messaging/invalid-argument",
]);

export const MAX_FIREBASE_RETRIES = 3;

export function classifyFirebaseError(code: string, attempts = 0) {
  if (INVALID_CODES.has(code)) return "invalid" as const;
  if (TRANSIENT_CODES.has(code)) {
    if (attempts >= MAX_FIREBASE_RETRIES) return "permanent" as const;
    return "transient" as const;
  }
  return "permanent" as const;
}

export function firebaseDeliveryJobId(deliveryId: string) {
  return `fcm-${deliveryId}`;
}

export function retryDelayMs(attempts: number) {
  return Math.min(60_000, 1000 * 2 ** attempts);
}
