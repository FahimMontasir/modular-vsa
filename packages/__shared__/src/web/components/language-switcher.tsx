import { useLingui } from "@lingui/react/macro";
import { useState } from "react";

import { setAppLanguage } from "@modular-vsa/i18n/i18n";
import { AppLanguage } from "@modular-vsa/i18n/languages";
import { Button } from "@modular-vsa/ui/button";
import { DropdownMenuItem } from "@modular-vsa/ui/dropdown-menu";
import { Spinner } from "@modular-vsa/ui/spinner";

export function LanguageSwitcher({ menu = false }: { menu?: boolean }) {
  const { i18n, t } = useLingui();
  const [pending, setPending] = useState(false);
  const currentLocale = i18n.locale;
  const targetLocale =
    currentLocale === AppLanguage.Bengali ? AppLanguage.English : AppLanguage.Bengali;
  const targetFlag = targetLocale === AppLanguage.Bengali ? "🇧🇩" : "🇺🇸";
  const accessibleLabel =
    targetLocale === AppLanguage.Bengali ? t`Switch to Bengali` : t`Switch to English`;

  async function changeLanguage(locale: (typeof AppLanguage)[keyof typeof AppLanguage]) {
    if (locale === currentLocale) return;
    setPending(true);
    try {
      await setAppLanguage(locale);
    } finally {
      setPending(false);
    }
  }

  const content = pending ? (
    <Spinner />
  ) : (
    <span className="text-base leading-none" aria-hidden="true">
      {targetFlag}
    </span>
  );

  if (menu) {
    return (
      <DropdownMenuItem disabled={pending} onClick={() => void changeLanguage(targetLocale)}>
        {content}
        {accessibleLabel}
      </DropdownMenuItem>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={accessibleLabel}
      title={accessibleLabel}
      disabled={pending}
      onClick={() => void changeLanguage(targetLocale)}
    >
      {content}
    </Button>
  );
}
