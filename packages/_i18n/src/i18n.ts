import { i18n } from "@lingui/core";

import { AppLanguage, type Locale } from "./languages";

const STORAGE_KEY = "app-language";

function isSupportedLocale(locale: string | null): locale is Locale {
  return !!locale && Object.values(AppLanguage).includes(locale as Locale);
}

/** Load and activate a language. */
export async function loadAndActivateLanguage(locale: Locale) {
  const { messages } = await import(`../locales/${locale}.po`);

  i18n.loadAndActivate({ locale, messages });

  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
}

/**
 * Get the app language.
 *
 * @returns The app language.
 */
export function getAppLanguage(): Locale {
  if (typeof localStorage !== "undefined") {
    const locale = localStorage.getItem(STORAGE_KEY);
    if (isSupportedLocale(locale)) return locale;
  }

  return AppLanguage.English;
}

/** Initialize the i18n. */
export async function initializeI18n() {
  await loadAndActivateLanguage(getAppLanguage());
}

/**
 * Set the app language.
 *
 * @param locale - The locale to set.
 */
export async function setAppLanguage(locale: Locale) {
  await loadAndActivateLanguage(locale);

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, locale);
  }
}
