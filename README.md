# modular-vsa

This is a Bun-first TypeScript monorepo that combines React, TanStack Router, Elysia, and Vite+.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/_ui`
- **Elysia** - Type-safe, high-performance framework
- **Bun** - Package manager, script runner, application runtime, compiler, and unit-test runner
- **Vite+** - Vite, formatting, linting, type checking, packaging, and workspace task orchestration
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **PWA** - Progressive Web App support

## Getting Started

Install Docker Desktop, the Vite+ CLI, and Bun 1.3.13, then run:

```bash
vp --version
bun install
bun dev
```

Vite+ uses the Node.js version in `.node-version` internally. Application code, package scripts,
the server, and unit tests continue to run through Bun. Node/npm are otherwise reserved for the
separate Playwright package under `tests/`.

`bun dev` starts and health-checks PostgreSQL, Redis, Garage, and the Garage dashboard; pushes the
local Drizzle schema; then runs the portal, API, and Drizzle Studio concurrently. Docker containers
remain available after the foreground development processes stop, which keeps restarts fast.

The API verifies an administrator from the four `BOOTSTRAP_ADMIN_*` variables before it starts
listening. The tracked local values are development-only. Production must provide secrets and run
`bun run db:migrate` before server startup; schema push remains a local-development convenience.

| Development service       | URL                                      |
| ------------------------- | ---------------------------------------- |
| Portal                    | http://localhost:3001                    |
| API                       | http://localhost:3000                    |
| Application API docs      | http://localhost:3000/api-docs           |
| Better Auth API reference | http://localhost:3000/api/auth/reference |
| Drizzle Studio            | https://local.drizzle.studio             |
| Garage S3 API             | http://localhost:3900                    |
| Garage storage dashboard  | http://localhost:3909                    |

The Garage dashboard login is `admin` / `admin`. Use `bun run dkr:stop` to stop infrastructure or
`bun run dkr:down` to remove its containers and network; named data volumes are preserved.

Host ports, Garage secrets, the WebUI login, and Drizzle Studio host/port are declared explicitly in
`apps/server/.env.local`. Container images and internal service endpoints remain in Compose. The
development server prints the Studio URL and storage dashboard credentials at startup. The shared
logger suppresses console output when `NODE_ENV=production`.

## Local environment and Firebase

Only application `.env.local` files are tracked because they contain deterministic
local-development values. Ordinary `.env`, staging/production env files, PEM files, and Firebase
Admin credentials remain ignored. Never put real shared or production secrets in a tracked env file.

The Firebase browser configuration is public and lives in `apps/portal/.env.local`. Firebase Admin uses
the ignored `packages/_firebase/service-key.json` locally, with production falling back to explicit
environment credentials or Google Application Default Credentials.

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/_ui`.

- Change design tokens and global styles in `packages/_ui/src/styles/globals.css`
- Update shared primitives in `packages/_ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/_ui/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
bun run add:ui -- accordion dialog popover sheet table
```

Import shared components like this:

```tsx
import { Button } from "@modular-vsa/ui/components/button";
```

### Add app‑specific blocks

If you want to add app-specific blocks instead of shared primitives, run the Bun-powered shadcn CLI
from the relevant app directory.

## Git Hooks and Validation

- Run formatting, linting, and type checking: `bun run check`
- Apply safe fixes: `bun run check -- --fix`
- Run Bun unit tests: `bun run test:unit`

## Project Structure

```text
modular-vsa/
├── apps/
│   ├── server/   # Elysia backend API
│   └── portal/   # Vite+ React SPA
├── packages/
│   ├── __config__/   # Shared TypeScript configuration
│   ├── __env__/      # Runtime environment schemas
│   ├── auth/        # Authentication wrapper (better‑auth)
│   ├── _db/          # Drizzle ORM schema & connection factory
│   ├── __shared__/       # Shared utility functions
│   ├── _ui/          # Shared shadcn/ui components and styles
│   └── home/         # Feature package for the Home domain (posts, comments)
└── ...
```

## Repository Configuration

### .github

- **hooks/** – Repository Git hooks.
  - `pre-commit` – Runs Vite+ checks and Bun unit tests before each commit.
- **workflows/** – CI pipelines.
  - `tests.yml` – Installs Vite+ and Bun, then checks, tests, and builds pull requests.
  - `playwright.yml.disabled` – Separate Node/npm Playwright lane, intentionally disabled.

These configurations help ensure consistent development environment, automated checks, and reproducible CI runs across the monorepo.

## Available Scripts

- `bun run dev`: Start Docker, push the local schema, and run all apps plus Drizzle Studio
- `bun run build`: Build all applications through cached Vite+ workspace tasks
- `bun run check`: Check formatting, lint rules, and TypeScript types through Vite+
- `bun run check -- --fix`: Apply supported formatter and linter fixes
- `bun run test:unit`: Run package unit tests with `bun:test`
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run dkr:stop`: Stop local infrastructure without removing containers or volumes
- `bun run dkr:down`: Remove local infrastructure containers and network while preserving volumes
- `bun run add:ui -- <component>`: Add shared UI primitives with Bun
- `cd apps/portal && bun run generate-pwa-assets`: Generate PWA assets

## End-to-End Tests

Playwright remains outside the Bun workspace because it requires Node.js:

```bash
cd tests
npm ci
npm test
```
