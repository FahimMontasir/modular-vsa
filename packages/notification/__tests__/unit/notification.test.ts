import { describe, expect, test } from "bun:test";

import {
  decodeCursor,
  directConversationKey,
  encodeCursor,
  normalizeAnnouncementTargets,
  normalizeInternalUrl,
  tombstone,
} from "../../src/server/helpers/notification";

describe("notification helpers", () => {
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
