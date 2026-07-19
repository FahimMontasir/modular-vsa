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

Install the Vite+ CLI and Bun 1.3.13, then install workspace dependencies with Bun:

```bash
vp --version
bun install
```

Vite+ uses the Node.js version in `.node-version` internally. Application code, package scripts,
the server, and unit tests continue to run through Bun. Node/npm are otherwise reserved for the
separate Playwright package under `tests/`.

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
bun run db:push
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

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

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications through cached Vite+ workspace tasks
- `bun run check`: Check formatting, lint rules, and TypeScript types through Vite+
- `bun run check -- --fix`: Apply supported formatter and linter fixes
- `bun run test:unit`: Run package unit tests with `bun:test`
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run add:ui -- <component>`: Add shared UI primitives with Bun
- `cd apps/portal && bun run generate-pwa-assets`: Generate PWA assets

## End-to-End Tests

Playwright remains outside the Bun workspace because it requires Node.js:

```bash
cd tests
npm ci
npm test
```
