import { describe, expect, test } from "bun:test";

import { ApiError } from "../../../src/server/apiError";

describe("ApiError", () => {
  test("creates instance with statusCode and message", () => {
    const error = new ApiError("Bad Request", "Bad request");

    expect(error.statusCode).toBe("Bad Request");
    expect(error.message).toBe("Bad request");
    expect(error.name).toBe("ApiError");
  });

  test("sets monitor option to false by default", () => {
    const error = new ApiError("Internal Server Error", "Internal server error");
    expect(error.monitor).toBe(false);
  });

  test("sets monitor option to true when provided", () => {
    const error = new ApiError("Internal Server Error", "Critical error", { monitor: true });
    expect(error.monitor).toBe(true);
  });

  test("extends Error and captures stack trace", () => {
    const error = new ApiError("Not Found", "Not found");

    expect(error instanceof Error).toBe(true);
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("ApiError");
  });

  test("handles various HTTP status codes", () => {
    const codes = [
      "OK",
      "Created",
      "Bad Request",
      "Unauthorized",
      "Forbidden",
      "Not Found",
      "Internal Server Error",
    ] as const;

    for (const code of codes) {
      const error = new ApiError(code, `${code} error`);
      expect(error.statusCode).toBe(code);
      expect(error.message).toBe(`${code} error`);
    }
  });
});