import { describe, expect, test } from "bun:test";

import {
  classifyFirebaseError,
  firebaseDeliveryJobId,
  retryDelayMs,
} from "../../src/def/notification/firebase-helpers";

describe("Firebase delivery helpers", () => {
  test("uses deterministic job identifiers", () => {
    expect(firebaseDeliveryJobId("delivery-1")).toBe("fcm-delivery-1");
  });

  test("classifies retryable and invalid registrations", () => {
    expect(classifyFirebaseError("messaging/server-unavailable")).toBe("transient");
    expect(classifyFirebaseError("messaging/registration-token-not-registered")).toBe("invalid");
    expect(classifyFirebaseError("messaging/sender-id-mismatch")).toBe("permanent");
  });

  test("caps exponential retry delay", () => {
    expect(retryDelayMs(0)).toBe(1000);
    expect(retryDelayMs(4)).toBe(16_000);
    expect(retryDelayMs(20)).toBe(60_000);
  });
});
