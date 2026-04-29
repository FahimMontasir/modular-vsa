# Env Package

This package is the **single source of truth** for runtime environment validation.

## What belongs here

- `src/server.ts` for server-only variables
- `src/web.ts` for Vite web variables
- `src/native.ts` for Expo/native variables

## Rules

- Keep each env schema scoped to its target runtime.
- Do not move app or feature logic into this package.
- Add new variables here first, then consume them through workspace imports like `@modular-vsa/env/server` or for web: `@modular-vsa/env/web` or for react native: `@modular-vsa/env/native`.
- Treat empty strings as missing values; this package should fail fast when config is incomplete.
- Use `zod` for schema validation and type inference
