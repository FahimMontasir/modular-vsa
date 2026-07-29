import type { EventParams } from "firebase/analytics";

const SAFE_VALUE = /^(?:[\w ./:-]{0,100})$/;

export function sanitizeTelemetryParams(params?: EventParams): EventParams | undefined {
  if (!params) return undefined;
  const entries: Array<[string, string | number | boolean]> = [];
  for (const [key, value] of Object.entries(params)) {
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(key)) continue;
    if (typeof value === "number" || typeof value === "boolean") entries.push([key, value]);
    if (typeof value === "string" && SAFE_VALUE.test(value)) entries.push([key, value]);
  }
  return Object.fromEntries(entries);
}

export async function trackEvent(name: string, params?: EventParams) {
  if (typeof window === "undefined" || !/^[a-z][a-z0-9_]{0,39}$/.test(name)) return;
  try {
    const { logEvent } = await import("./analytics");
    await logEvent(name, sanitizeTelemetryParams(params));
  } catch {
    // Telemetry is best-effort and must never interrupt the user action being measured.
  }
}

export async function trackScreen(pathname: string) {
  await trackEvent("screen_view", {
    screen_name: pathname.replaceAll(/[^a-zA-Z0-9/_-]/g, "").slice(0, 100) || "/",
  });
}
