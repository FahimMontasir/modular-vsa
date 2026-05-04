# modular-vsa

This is a modern TypeScript stack that combines React, TanStack Router, Elysia, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **React Native** - Build mobile apps using React
- **Expo** - Tools for React Native development
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/_ui`
- **Elysia** - Type-safe, high-performance framework
- **Bun** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Oxlint** - Oxlint + Oxfmt (linting & formatting)
- **PWA** - Progressive Web App support
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

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

Open [http://localhost:5173](http://localhost:5173) in your browser to see the web application.
Use the Expo Go app to run the mobile application.
The API is running at [http://localhost:3000](http://localhost:3000).

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/_ui`.

- Change design tokens and global styles in `packages/_ui/src/styles/globals.css`
- Update shared primitives in `packages/_ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/_ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/_ui
```

Import shared components like this:

```tsx
import { Button } from "@modular-vsa/ui/components/button";
```

### Add app‑specific blocks

If you want to add app‑specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Git Hooks and Validation

- Run the monorepo checks: `bun run check`

## Project Structure

```text
modular-vsa/
├── apps/
│   ├── native/   # Expo React Native app
│   ├── server/   # Elysia backend API
│   └── web/      # Vite React SPA
├── packages/
│   ├── __config__/   # Shared TypeScript configuration
│   ├── __env__/      # Runtime environment schemas
│   ├── _auth/        # Authentication wrapper (better‑auth)
│   ├── _db/          # Drizzle ORM schema & connection factory
│   ├── _utils/       # Shared utility functions
│   ├── _ui/          # Shared shadcn/ui components and styles
│   ├── home/         # Feature package for the Home domain (posts, comments)
│   └── security/     # Security‑related services (placeholder)
└── ...
```

## Repository Configuration

### .github

- **actions/** – Custom GitHub Actions used in CI.  
  - `bun` – Action that sets up Bun runtime for all workflows.  
- **hooks/** – Server-side Git hooks managed by `pre-commit`.  
  - `pre-commit` – Runs linting, formatting, and type checks before each commit.  
- **workflows/** – CI pipelines.  
  - `tests.yml` – Runs unit, integration, and end‑to‑end tests on push/PR.

### .vscode

- `settings.json` – Workspace settings (e.g., TypeScript validation, ESLint integration, Bun terminal).  
- `extensions.json` – Recommended extensions for contributors (`esbenp.prettier-vscode`, `bradlc.vscode-tailwindcss`, `Biomejs.biome`, etc.).

These configurations help ensure consistent development environment, automated checks, and reproducible CI runs across the monorepo.

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:server`: Start only the server
- `bun run check-types`: Check TypeScript types across all apps
- `bun run dev:native`: Start the React Native/Expo development server
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run check`: Run Oxlint and Oxfmt
- `cd apps/web && bun run generate-pwa-assets`: Generate PWA assets
