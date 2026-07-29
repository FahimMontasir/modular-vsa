# Environment

Single source of truth for validated runtime configuration.

- `src/server.ts` reads `Bun.env`; `src/web.ts` reads Vite's `import.meta.env`.
- Define schemas with Elysia `t` and parse with TypeBox `Value.Parse`.
- Treat empty strings as missing and fail fast on incomplete configuration.
- Add variables here before importing `@modular-vsa/env/server` or `@modular-vsa/env/web`.
- Keep runtime targets separate and keep feature logic out.
- Track deterministic local values only; store real secrets in ignored or deployment configuration.
