import { describe, expect, test } from "bun:test";

import { sanitizeTelemetryParams } from "../../src/web/telemetry";

describe("analytics sanitization", () => {
  test("keeps normalized outcomes and drops content-shaped values", () => {
    expect(
      sanitizeTelemetryParams({
        outcome: "granted",
        count: 2,
        message_body: "hello@example.com?token=secret&body=private",
        "invalid-key": "value",
      })
    ).toEqual({ outcome: "granted", count: 2 });
  });
});
