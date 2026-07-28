import { describe, expect, test } from "bun:test";

import {
  ensureBootstrapAdminWith,
  type BootstrapAdminInput,
  type BootstrapCandidate,
} from "../src/server/bootstrap-admin-core";

const input: BootstrapAdminInput = {
  name: " Administrator ",
  email: " ADMIN@Example.com ",
  username: " Admin ",
  displayUsername: " Admin ",
  password: "a-secure-password",
};

const candidate: BootstrapCandidate = {
  email: "admin@example.com",
  username: "admin",
  role: "admin",
};

describe("bootstrap administrator", () => {
  test("creates the administrator once with normalized identity", async () => {
    const created: BootstrapAdminInput[] = [];
    const result = await ensureBootstrapAdminWith(
      {
        async findCandidates() {
          return [];
        },
        async createAdmin(values) {
          created.push(values);
          return candidate;
        },
      },
      input
    );

    expect(result.created).toBe(true);
    expect(created[0]).toMatchObject({
      name: "Administrator",
      email: "admin@example.com",
      username: "admin",
    });
  });

  test("does not rewrite an existing administrator", async () => {
    let createCalls = 0;
    const result = await ensureBootstrapAdminWith(
      {
        async findCandidates() {
          return [candidate];
        },
        async createAdmin() {
          createCalls += 1;
          return candidate;
        },
      },
      input
    );

    expect(result.created).toBe(false);
    expect(createCalls).toBe(0);
  });

  test("rejects identity and role conflicts", async () => {
    return expect(
      ensureBootstrapAdminWith(
        {
          async findCandidates() {
            return [{ ...candidate, role: "director" }];
          },
          async createAdmin() {
            return candidate;
          },
        },
        input
      )
    ).rejects.toThrow("conflicts");
  });

  test("accepts a replica creation race after verification", async () => {
    let reads = 0;
    const result = await ensureBootstrapAdminWith(
      {
        async findCandidates() {
          reads += 1;
          return reads === 1 ? [] : [candidate];
        },
        async createAdmin() {
          throw new Error("unique constraint");
        },
      },
      input
    );

    expect(result.raced).toBe(true);
    expect(result.candidate).toEqual(candidate);
  });

  test("propagates invalid creation when no verified race exists", async () => {
    return expect(
      ensureBootstrapAdminWith(
        {
          async findCandidates() {
            return [];
          },
          async createAdmin() {
            throw new Error("invalid credentials");
          },
        },
        input
      )
    ).rejects.toThrow("invalid credentials");
  });
});
