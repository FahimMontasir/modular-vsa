import { LANGUAGES_MAP } from "./languages";

export function codeToLanguageName(code: string): string {
  return LANGUAGES_MAP[code as keyof typeof LANGUAGES_MAP]?.name ?? code;
}

export function codesToLanguageNames(codes: string[]): string[] {
  return codes.map(codeToLanguageName);
}
