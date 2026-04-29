import { describe, expect, test } from "bun:test";

import { getCurrentDateTime } from "../../../src/common/date-time";

describe("date-time utilities", () => {
  test("getCurrentDateTime returns ISO string format", () => {
    const result = getCurrentDateTime();
    expect(typeof result).toBe("string");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  test("getCurrentDateTime returns valid Date", () => {
    const result = getCurrentDateTime();
    const date = new Date(result);
    expect(date.toString()).not.toBe("Invalid Date");
  });

  test("getCurrentDateTime returns recent timestamp", () => {
    const result = getCurrentDateTime();
    const timestamp = new Date(result).getTime();
    const now = Date.now();
    const diff = Math.abs(now - timestamp);
    expect(diff).toBeLessThan(1000);
  });
});
