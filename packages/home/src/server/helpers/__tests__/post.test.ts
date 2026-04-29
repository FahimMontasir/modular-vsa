import { describe, expect, test } from "bun:test";

import { ApiError } from "@modular-vsa/utils/server/apiError";

import {
  normalizeCreatePostValues,
  normalizePostListQuery,
  normalizeUpdatePostValues,
  requireOne,
  requirePayload,
} from "../post";

describe("post helpers", () => {
  test("normalizeCreatePostValues applies defaults and trims title", () => {
    const values = normalizeCreatePostValues({
      title: "  Hello world  ",
      content: "Body",
      published: undefined,
    });

    expect(values).toEqual({
      title: "Hello world",
      content: "Body",
      published: false,
    });
  });

  test("normalizeUpdatePostValues only includes provided fields", () => {
    const values = normalizeUpdatePostValues({
      title: "  Updated  ",
      content: undefined,
      published: true,
    });

    expect(values).toEqual({
      title: "Updated",
      published: true,
    });
  });

  test("normalizePostListQuery trims the title filter", () => {
    expect(
      normalizePostListQuery({
        title: "  search term  ",
        published: false,
      })
    ).toEqual({
      title: "search term",
      published: false,
    });
  });

  test("requireOne throws when empty", () => {
    expect(() => requireOne([], "Post not found")).toThrow(ApiError);
  });

  test("requirePayload throws when empty", () => {
    expect(() => requirePayload({}, "No update fields provided")).toThrow(ApiError);
  });
});
