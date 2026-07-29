const TRANSIENT_CODES = new Set([
  "messaging/internal-error",
  "messaging/server-unavailable",
  "messaging/unknown-error",
  "messaging/quota-exceeded",
]);

const INVALID_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
  "messaging/invalid-argument",
]);

export function classifyFirebaseError(code: string) {
  if (INVALID_CODES.has(code)) return "invalid" as const;
  if (TRANSIENT_CODES.has(code)) return "transient" as const;
  return "permanent" as const;
}

export function firebaseDeliveryJobId(deliveryId: string) {
  return `fcm-${deliveryId}`;
}

export function retryDelayMs(attempts: number) {
  return Math.min(60_000, 1000 * 2 ** attempts);
}
