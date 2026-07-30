import { describe, expect, test } from "bun:test";

import { aggregateFirebaseDeliveryState } from "../../src/def/notification/firebase-delivery-state";
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
    expect(classifyFirebaseError("messaging/server-unavailable", 2)).toBe("transient");
    expect(classifyFirebaseError("messaging/server-unavailable", 3)).toBe("permanent");
    expect(classifyFirebaseError("messaging/registration-token-not-registered")).toBe("invalid");
    expect(classifyFirebaseError("messaging/installation-id-not-registered")).toBe("invalid");
    expect(classifyFirebaseError("messaging/sender-id-mismatch")).toBe("permanent");
  });

  test("caps exponential retry delay", () => {
    expect(retryDelayMs(0)).toBe(1000);
    expect(retryDelayMs(4)).toBe(16_000);
    expect(retryDelayMs(20)).toBe(60_000);
  });

  test("accepts a delivery only when every active browser accepted it", () => {
    const now = new Date("2026-07-29T12:00:00.000Z");
    expect(
      aggregateFirebaseDeliveryState(
        [
          { status: "accepted", nextAttemptAt: now, lastError: null },
          { status: "accepted", nextAttemptAt: now, lastError: null },
        ],
        now
      )
    ).toEqual({ status: "accepted", nextAttemptAt: now, lastError: null });
  });

  test("keeps transient browsers retryable without resending accepted targets", () => {
    const now = new Date("2026-07-29T12:00:00.000Z");
    const retryAt = new Date("2026-07-29T12:00:05.000Z");
    expect(
      aggregateFirebaseDeliveryState(
        [
          { status: "accepted", nextAttemptAt: now, lastError: null },
          { status: "retry", nextAttemptAt: retryAt, lastError: "messaging/server-unavailable" },
        ],
        now
      )
    ).toEqual({
      status: "retry",
      nextAttemptAt: retryAt,
      lastError: "messaging/server-unavailable",
    });
  });

  test("skips deliveries without active browser registrations", () => {
    const now = new Date("2026-07-29T12:00:00.000Z");
    expect(aggregateFirebaseDeliveryState([], now)).toEqual({
      status: "skipped",
      nextAttemptAt: now,
      lastError: "No active Firebase registration",
    });
  });
});
