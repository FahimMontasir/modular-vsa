import { describe, expect, test } from "bun:test";

import { applicationActions, roleHasPermission, type RoleName } from "../src/access-control";
import { resolveAuthorization } from "../src/server/authorization-core";

function requestAs(role: RoleName, permissions: Parameters<typeof roleHasPermission>[1] | true) {
  return resolveAuthorization({
    permissions,
    getSession: async () => ({
      user: { id: `${role}-user`, role },
      session: { id: `${role}-session` },
    }),
    userHasPermission: async (_userId, requested) => roleHasPermission(role, requested),
  });
}

async function expectStatus(promise: Promise<unknown>, statusCode: "Unauthorized" | "Forbidden") {
  try {
    await promise;
    throw new Error(`Expected ${statusCode}`);
  } catch (error) {
    expect(error).toMatchObject({ statusCode });
  }
}

describe("route authorization", () => {
  test("returns 401 when no session exists", async () => {
    await expectStatus(
      resolveAuthorization({
        permissions: true,
        getSession: async () => null,
        userHasPermission: async () => false,
      }),
      "Unauthorized"
    );
  });

  test("allows authenticated-only routes", async () => {
    const session = await requestAs("director", true);
    expect(session.user.id).toBe("director-user");
  });

  test("allows director reads and rejects director mutations", async () => {
    const result = await requestAs("director", { post: [applicationActions.post.read] });
    expect(result).toBeDefined();
    await expectStatus(
      requestAs("director", { post: [applicationActions.post.create] }),
      "Forbidden"
    );
  });

  test("allows administrator mutations", () => {
    return expect(
      requestAs("admin", { post: [applicationActions.post.delete] })
    ).resolves.toBeDefined();
  });
});
