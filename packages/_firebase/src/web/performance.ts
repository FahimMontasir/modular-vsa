import {
  initializePerformance,
  trace as _trace,
  type FirebasePerformance,
  type PerformanceSettings,
  type PerformanceTrace,
} from "firebase/performance";

import { getApp } from "./init";

let performance: FirebasePerformance | null = null;

/**
 * Returns the singleton Firebase Performance instance, initializing it on first call.
 *
 * @param settings - Optional performance settings (e.g. `dataCollectionEnabled`).
 * @see https://firebase.google.com/docs/perf-mon
 */
export function getPerformance(settings?: PerformanceSettings): FirebasePerformance {
  if (!performance) {
    performance = initializePerformance(getApp(), settings);
  }
  return performance;
}

/**
 * Creates a named custom trace for performance measurement.
 *
 * The caller is responsible for calling `.start()` and `.stop()` on the returned trace, or use
 * {@link traceAsync} for automatic timing.
 *
 * @param name - The trace name (visible in the Firebase console).
 * @see https://firebase.google.com/docs/perf-mon/custom-traces
 */
export function trace(name: string): PerformanceTrace {
  return _trace(getPerformance(), name);
}

/**
 * Wraps an async function with automatic performance trace timing.
 *
 * The trace is started before `fn` is called and stopped after it resolves (or rejects). The trace
 * name is visible in the Firebase Performance dashboard.
 *
 * @example
 *   const data = await traceAsync("fetch-home-data", () => api.getHomeData());
 *
 * @param name - The trace name.
 * @param fn - The async function to measure.
 * @returns The return value of `fn`.
 */
export async function traceAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const t = trace(name);
  t.start();
  try {
    return await fn();
  } finally {
    t.stop();
  }
}
