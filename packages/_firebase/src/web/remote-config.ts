import {
  getRemoteConfig as _getRemoteConfig,
  fetchAndActivate as _fetchAndActivate,
  getString as _getString,
  getNumber as _getNumber,
  getBoolean as _getBoolean,
  type RemoteConfig,
  type RemoteConfigSettings,
} from "firebase/remote-config";

import { getApp } from "./init";

let remoteConfig: RemoteConfig | null = null;

const defaultSettings: RemoteConfigSettings = {
  minimumFetchIntervalMillis: 3_600_000, // 1 hour
  fetchTimeoutMillis: 60_000, // 1 minute
};

/**
 * Returns the singleton Remote Config instance, initializing it on first call.
 *
 * Applies sensible defaults (1-hour fetch interval in dev; set to 0 for real-time updates during
 * active development).
 *
 * @param settings - Optional overrides for Remote Config settings.
 * @see https://firebase.google.com/docs/remote-config
 */
export function getRemoteConfig(settings?: Partial<RemoteConfigSettings>): RemoteConfig {
  if (!remoteConfig) {
    remoteConfig = _getRemoteConfig(getApp());
    remoteConfig.settings = { ...defaultSettings, ...settings };
  }
  return remoteConfig;
}

/**
 * Fetches the latest config values from the server and activates them.
 *
 * @returns `true` if new values were activated, `false` if already current.
 * @see https://firebase.google.com/docs/remote-config/get-started#fetch-and-activate
 */
export async function fetchAndActivate(): Promise<boolean> {
  return _fetchAndActivate(getRemoteConfig());
}

/**
 * Returns the string value for the given Remote Config key.
 *
 * @param key - The config parameter key.
 * @see https://firebase.google.com/docs/remote-config/get-started#get-single-value
 */
export function getString(key: string): string {
  return _getString(getRemoteConfig(), key);
}

/**
 * Returns the number value for the given Remote Config key.
 *
 * @param key - The config parameter key.
 * @see https://firebase.google.com/docs/remote-config/get-started#get-single-value
 */
export function getNumber(key: string): number {
  return _getNumber(getRemoteConfig(), key);
}

/**
 * Returns the boolean value for the given Remote Config key.
 *
 * @param key - The config parameter key.
 * @see https://firebase.google.com/docs/remote-config/get-started#get-single-value
 */
export function getBoolean(key: string): boolean {
  return _getBoolean(getRemoteConfig(), key);
}
