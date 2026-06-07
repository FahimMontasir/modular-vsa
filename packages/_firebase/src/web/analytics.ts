import {
  getAnalytics as _getAnalytics,
  isSupported,
  logEvent as _logEvent,
  type Analytics,
  type AnalyticsCallOptions,
  type EventParams,
} from "firebase/analytics";

import { getApp } from "./init";

let analytics: Analytics | null = null;

/**
 * Returns the singleton Firebase Analytics instance, initializing it on first call.
 *
 * Checks {@link isSupported} before initializing to avoid crashes in environments where Analytics is
 * not available (e.g. browser extensions, SSR). Returns `null` when unsupported.
 *
 * @see https://firebase.google.com/docs/analytics
 */
export async function getAnalytics(): Promise<Analytics | null> {
  if (analytics) return analytics;
  const supported = await isSupported();
  if (!supported) return null;
  analytics = _getAnalytics(getApp());
  return analytics;
}

/**
 * Logs a Firebase Analytics event.
 *
 * This is a thin wrapper around {@link _logEvent} that first resolves the analytics instance. If
 * analytics is not supported (e.g. SSR), the call is a no-op.
 *
 * @param eventName - The event name (e.g. `"screen_view"`, `"login"`).
 * @param eventParams - Optional event parameters.
 * @param options - Optional analytics call options.
 * @see https://firebase.google.com/docs/analytics/events
 */
export async function logEvent(
  eventName: string,
  eventParams?: EventParams,
  options?: AnalyticsCallOptions
): Promise<void> {
  const instance = await getAnalytics();
  if (!instance) return;
  _logEvent(instance, eventName, eventParams, options);
}
