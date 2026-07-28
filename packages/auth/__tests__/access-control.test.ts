import { describe, expect, test } from "bun:test";

import { applicationActions, roleHasPermission } from "../src/access-control";

describe("shared access control", () => {
  test("admin can perform every application mutation", () => {
    expect(roleHasPermission("admin", { post: [applicationActions.post.create] })).toBe(true);
    expect(roleHasPermission("admin", { post: [applicationActions.post.update] })).toBe(true);
    expect(roleHasPermission("admin", { post: [applicationActions.post.delete] })).toBe(true);
    expect(roleHasPermission("admin", { storage: [applicationActions.storage.upload] })).toBe(true);
    expect(roleHasPermission("admin", { user: ["ban", "set-role"] })).toBe(true);
    expect(roleHasPermission("admin", { session: ["revoke"] })).toBe(true);
  });

  test("director is strictly read-only", () => {
    expect(roleHasPermission("director", { post: [applicationActions.post.read] })).toBe(true);
    expect(roleHasPermission("director", { user: ["list", "get"] })).toBe(true);
    expect(roleHasPermission("director", { session: ["list"] })).toBe(true);
    expect(roleHasPermission("director", { post: [applicationActions.post.create] })).toBe(false);
    expect(roleHasPermission("director", { user: ["update"] })).toBe(false);
    expect(roleHasPermission("director", { session: ["revoke"] })).toBe(false);
    expect(roleHasPermission("director", { storage: [applicationActions.storage.upload] })).toBe(
      false
    );
  });

  test("unknown and multiple roles are handled safely", () => {
    expect(roleHasPermission("unknown", { post: ["read"] })).toBe(false);
    expect(roleHasPermission("unknown,director", { post: ["read"] })).toBe(true);
  });
});
