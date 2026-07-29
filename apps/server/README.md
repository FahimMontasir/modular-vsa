# Server

Elysia composition root for authentication, API routes, middleware, monitoring, and workers.

- `src/index.ts` assembles the app and starts workers; keep feature logic out of it.
- `src/v1-routes.ts` mounts first-party versioned route objects.
- `src/utils/` is for server-app-specific middleware and configuration, not shared utilities.
- Runtime configuration comes from `@modular-vsa/env/server`.

From the repository root, `bun dev` starts the complete stack. API docs are available at http://localhost:3100/api-docs and Better Auth docs at http://localhost:3100/api/auth/reference.

Local ports and development credentials live in the tracked `apps/server/.env.local`. Use deployment secrets in production and run `bun run db:migrate` before startup.

```bash
bun -F @modular-vsa/server dev
bun -F @modular-vsa/server build
```
