import type { StatusMap } from "elysia";

export class ApiError<Code extends keyof StatusMap, T extends string> extends Error {
  public monitor: boolean;

  constructor(
    public statusCode: Code,
    public message: T,
    options?: {
      monitor?: boolean;
    }
  ) {
    super(message);
    this.name = "ApiError";
    this.monitor = options?.monitor ?? false;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
