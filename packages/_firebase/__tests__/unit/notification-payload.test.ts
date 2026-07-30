import { describe, expect, test } from "bun:test";

import {
  firebaseNotificationPresentation,
  safeNotificationDestination,
} from "../../src/web/notification-payload";

describe("Firebase browser notification payloads", () => {
  test("keeps only safe internal destinations", () => {
    expect(safeNotificationDestination("/?messenger=conversation-1")).toBe(
      "/?messenger=conversation-1"
    );
    expect(safeNotificationDestination("//example.com/path")).toBe("/");
    expect(safeNotificationDestination("https://example.com/path")).toBe("/");
  });

  test("normalizes foreground and background popup content", () => {
    expect(
      firebaseNotificationPresentation({
        destination: "/account",
        pushBody: "Review the update",
        pushTitle: "Security update",
      })
    ).toEqual({
      title: "Security update",
      options: {
        body: "Review the update",
        icon: "/favicon.svg",
        data: { destination: "/account" },
      },
    });
  });
});
