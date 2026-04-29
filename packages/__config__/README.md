# Config Package

This package is **TypeScript-only**.

## Purpose

`@modular-vsa/config` exists to hold shared TypeScript configuration that can be reused across workspace packages.

## Rules

- Put only TypeScript config here.
- Do not add app config, runtime config, env config, lint config, build config, or test config here.
- Any non-TS configuration must stay package-scoped inside the package that uses it.
- If a package needs its own config, define it in that package instead of promoting it to this shared package.

## Current files

- `tsconfig.base.json` — shared TypeScript compiler options

## Usage

Extend this base config from package-local `tsconfig.json` files.

Keep the package small, predictable, and boring. Boring config is good config.

```json
{
  "extends": "@modular-vsa/config/tsconfig.base.json",
  "compilerOptions": {
    // package-specific overrides here
  }
}
```
