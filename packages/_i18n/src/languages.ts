export const AppLanguage = {
  English: "en",
  Bengali: "bn",
} as const;

export type Locale = (typeof AppLanguage)[keyof typeof AppLanguage];

export const APP_LANGUAGES = [
  { code: AppLanguage.English, name: "English" },
  { code: AppLanguage.Bengali, name: "বাংলা - Bengali" },
] as const;

export const LANGUAGES_MAP = Object.fromEntries(
  APP_LANGUAGES.map((lang) => [lang.code, lang])
) as Record<Locale, (typeof APP_LANGUAGES)[number]>;
