import { describe, expect, test } from "bun:test";

import {
  decodeCursor,
  directConversationKey,
  encodeCursor,
  normalizeAnnouncementTargets,
  normalizeInternalUrl,
  tombstone,
} from "../../src/server/helpers/notification";
import { flattenMessagePages } from "../../src/web/helpers/message-order";
import { formatNotificationDate } from "../../src/web/helpers/notification-date";

describe("notification helpers", () => {
  test("formats notification dates from recent to calendar dates", () => {
    const now = new Date("2026-09-29T12:00:00");

    expect(formatNotificationDate(new Date(now.getTime() - 2_000), now, "en-US")).toBe("2s ago");
    expect(formatNotificationDate(new Date(now.getTime() - 3_600_000), now, "en-US")).toBe(
      "1h ago"
    );
    expect(formatNotificationDate(new Date("2026-09-28T23:00:00"), now, "en-US")).toBe("yesterday");
    expect(formatNotificationDate(new Date("2026-09-20T10:00:00"), now, "en-US")).toMatch(
      /^10:00 AM · Sep 20$/
    );
  });

  test("orders notification pages newest-first and direct messages chronologically", () => {
    const pages = [{ items: [3, 4] }, { items: [1, 2] }];

    expect(flattenMessagePages(pages, true)).toEqual([4, 3, 2, 1]);
    expect(flattenMessagePages(pages, false)).toEqual([1, 2, 3, 4]);
  });

  test("canonicalizes a direct conversation pair", () => {
    expect(directConversationKey("z-user", "a-user")).toBe("direct:a-user:z-user");
    expect(directConversationKey("a-user", "z-user")).toBe("direct:a-user:z-user");
  });

  test("round-trips a cursor and rejects malformed cursors", () => {
    const createdAt = new Date("2026-07-29T12:00:00.000Z");
    expect(decodeCursor(encodeCursor(createdAt, "message-1"))).toEqual({
      createdAt,
      id: "message-1",
    });
    expect(decodeCursor("not-a-cursor")).toBeUndefined();
  });

  test("accepts only internal action paths", () => {
    expect(normalizeInternalUrl("/account/security")).toBe("/account/security");
    expect(() => normalizeInternalUrl("https://example.com")).toThrow();
    expect(() => normalizeInternalUrl("//example.com")).toThrow();
  });

  test("normalizes announcement targets", () => {
    expect(normalizeAnnouncementTargets([{ kind: "role", value: " admin " }])).toEqual([
      { kind: "role", value: "admin" },
    ]);
    expect(() =>
      normalizeAnnouncementTargets([{ kind: "all" }, { kind: "role", value: "admin" }])
    ).toThrow();
    expect(() => normalizeAnnouncementTargets([{ kind: "user" }])).toThrow();
  });

  test("returns a content-free tombstone for deleted messages", () => {
    const deletedAt = new Date();
    const deleted = tombstone({ deletedAt, body: "secret", title: "title", actionUrl: "/private" });
    expect(deleted.body).toBe("");
    expect(deleted.title).toBeNull();
    expect(deleted.actionUrl).toBeNull();
  });
});
