import { defineConfig } from "@lingui/cli";
import type { CatalogFormatter } from "@lingui/conf";
import { formatter } from "@lingui/format-po";

import { getTranslation } from "./src/helpers";

const defaultFormatter = formatter();

const langs = { en: "en", bn: "bn" };

/** Lingui formatter that automatically translates messages. */
const format = {
  ...defaultFormatter,
  async serialize(catalog, ctx) {
    const existingCatalog = ctx.existing ? await defaultFormatter.parse(ctx.existing, ctx) : null;
    const newCatalog = catalog;

    for (const [key, { translation, message }] of Object.entries(catalog)) {
      if (translation) {
        if (existingCatalog?.[key]) {
          // @ts-expect-error - preserving extra metadata from existing catalog
          newCatalog[key].extra = existingCatalog[key].extra;
        }
        continue;
      }

      if (!message || !ctx.locale) continue;

      // @ts-expect-error - Lingui catalog typings allow assignment
      newCatalog[key].translation =
        ctx.locale === "en"
          ? message
          : await getTranslation(message, langs[ctx.locale as keyof typeof langs]);

      // @ts-expect-error - Lingui catalog typings allow assignment
      newCatalog[key].extra = {
        translatorComments: [
          ctx.locale === "en" ? "Source language" : "Translated by Google Translate",
        ],
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
      include: ["../../apps/portal/src", "../../packages"],
    },
  ],
});
