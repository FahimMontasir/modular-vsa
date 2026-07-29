# Internationalization

Shared Lingui configuration, English/Bengali catalogs, locale activation, and language helpers.

- Keep supported locale metadata in `src/languages.ts`.
- Keep catalog loading, persistence, and activation in `src/i18n.ts`.
- Public exports are `@modular-vsa/i18n/i18n`, `/languages`, `/utils`, and `/config`.
- Use Lingui macros for user-facing portal copy and keep feature messages with the feature source.
- `lingui.config.ts` extracts messages from the portal and packages; generated translations must be reviewed.
- Keep feature-specific UI and business logic out of this package.

```bash
bun -F @modular-vsa/i18n intl:extract
bun -F @modular-vsa/i18n intl:compile
```
