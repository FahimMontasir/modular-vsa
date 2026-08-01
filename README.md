# modular-vsa

Bun-first TypeScript monorepo with a React/TanStack Router portal, Elysia API, Drizzle/PostgreSQL, Better Auth, shared shadcn/Base UI components, TanStack Form/Table/Virtual/Pacer utilities, background jobs, S3-compatible storage, Firebase messaging, and Playwright.

## Start locally

Requires Docker Desktop, Bun 1.3.13, Vite+, and the Node version in `.node-version`.

```bash
vp --version
bun install
bun dev
```

`bun dev` starts PostgreSQL, Redis, Garage, the portal, API, and Drizzle Studio, and pushes the local schema. The tracked `.env.local` files contain development-only values. Never store shared or production secrets there; production must use deployment secrets and `bun run db:migrate`.

| Service          | URL                                      |
| ---------------- | ---------------------------------------- |
| Portal           | http://localhost:3001                    |
| API              | http://localhost:3100                    |
| API docs         | http://localhost:3100/api-docs           |
| Better Auth docs | http://localhost:3100/api/auth/reference |
| Drizzle Studio   | https://local.drizzle.studio             |
| Garage S3 API    | http://localhost:3900                    |
| Garage dashboard | http://localhost:3909                    |

The local Garage dashboard login is `admin` / `admin`.

## Workspace

```text
apps/portal       React PWA and file-based routes
apps/server       Elysia composition and API versioning
packages/auth     Authentication and authorization
packages/home     Home feature
packages/notification  Durable inbox, messaging, and FCM outbox
packages/_db      Drizzle schemas and connection
packages/_ui      Shared components and design tokens
packages/_storage S3-compatible storage
packages/_firebase Firebase adapters
packages/_jobs    BullMQ workers and schedules
packages/_i18n    Lingui configuration
packages/__env__  Runtime environment schemas
packages/__shared__ Shared runtime utilities
packages/__config__ Shared TypeScript configuration
tests             Playwright E2E package
```

Feature packages own their server and web behavior. Database shape starts in `_db`; shared UI and tokens stay in `_ui`.

## Common commands

```bash
bun run dev                 # local stack
bun run build               # workspace build
bun run check               # format, lint, and type-check
bun run test:unit           # dependency-free package logic
bun run test:integration    # first-party routes with local infrastructure
bun run test:e2e            # portal pages with Playwright
bun run test:all            # all suites
bun run db:generate         # generate migrations
bun run db:migrate          # apply migrations
bun run db:studio           # open Drizzle Studio
bun run add:ui -- button    # add shared shadcn primitives
bun run dkr:stop            # stop local infrastructure
bun run dkr:down            # remove containers/network; preserve volumes
```

Playwright is the only npm-managed area. Install it once with `npm --prefix tests ci`.

## Package guides

Each app and package README states its ownership boundary and critical setup. Start with [`tests/README.md`](tests/README.md) for test policy, [`packages/_ui/README.md`](packages/_ui/README.md) for UI conventions, or the affected feature package for its data flow.
