# Env Package

This package is the **single source of truth** for runtime environment validation.

## What belongs here

- `src/server.ts` for server-only variables
- `src/web.ts` for Vite web variables

## Rules

- Keep each env schema scoped to its target runtime.
- Do not move app or feature logic into this package.
- Add new variables here first, then consume them through workspace imports like `@modular-vsa/env/server` or `@modular-vsa/env/web`.
- Treat empty strings as missing values; this package should fail fast when config is incomplete.
- Define schemas with Elysia `t` and parse them with TypeBox `Value.Parse`.
- Server values come directly from `Bun.env`; browser values come from Vite's `import.meta.env`.
- Keep deterministic development values in tracked `.env.local` files. Put real secrets in ignored deployment configuration.
