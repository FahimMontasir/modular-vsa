import { Globe } from "lucide-react";

import { getAppLanguage, setAppLanguage } from "@modular-vsa/i18n/i18n";
import { AppLanguage } from "@modular-vsa/i18n/languages";

function toggleLanguage() {
  const current = getAppLanguage();
  const next = current === AppLanguage.English ? AppLanguage.Bengali : AppLanguage.English;
  setAppLanguage(next);
}

export function LanguageToggle() {
  return (
    <button type="button" onClick={toggleLanguage}>
      <Globe className="h-5 w-5" />
      <span className="sr-only">Toggle language</span>
    </button>
  );
}
