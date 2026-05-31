import { defineConfig } from "@lingui/cli";
import type { CatalogFormatter } from "@lingui/conf";
import { formatter } from "@lingui/format-po";

import { getTranslation } from "./src/helpers";

const defaultFormatter = formatter();

const langs = { en: "en", bn: "bn" };

/** Regular expression to match unsupported placeholders in translation texts */
const unsupportedRegex = /\{[a-zA-Z]+\}|<[0-9]+>/g;

/** Lingui formatter that automatically translates messages. */
const format = {
  ...defaultFormatter,
  async serialize(catalog, ctx) {
    const existingCatalog = ctx.existing ? await defaultFormatter.parse(ctx.existing, ctx) : null;
    const newCatalog = catalog;

    for (const [key, { translation, message }] of Object.entries(catalog)) {
      if (translation || message?.match(unsupportedRegex)) {
        if (existingCatalog?.[key]) {
          // @ts-expect-error - preserving extra metadata from existing catalog
          newCatalog[key].extra = existingCatalog[key].extra;
        }
        continue;
      }

      if (!message || !ctx.locale) continue;

      // @ts-expect-error - Lingui catalog typings allow assignment
      newCatalog[key].translation = await getTranslation(
        message,
        langs[ctx.locale as keyof typeof langs]
      );

      // @ts-expect-error - Lingui catalog typings allow assignment
      newCatalog[key].extra = {
        translatorComments: ["Translated by Google Translate"],
      };
    }

    return defaultFormatter.serialize(newCatalog, ctx);
  },
} satisfies CatalogFormatter;

export default defineConfig({
  format,
  macro: {
    jsxPlaceholderAttribute: "_t",
    jsxPlaceholderDefaults: {
      a: "link",
      strong: "bold",
    },
  },
  sourceLocale: "en",
  locales: ["en", "bn"],
  fallbackLocales: { default: "en" },
  catalogs: [
    {
      path: "./locales/{locale}",
      include: ["../../apps/web/src", "../../packages"],
    },
  ],
});
