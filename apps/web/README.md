# Web App

The web front‑end for the **modular‑vsa** monorepo, built with Vite, React and TanStack Router.

## Development

```bash
bun install
bun run dev:web   # Starts Vite dev server on http://localhost:5173
```

## Project Layout

```text
apps/web/
├── src/
│   ├── main.tsx          # Entry point
│   ├── routeTree.gen.ts  # Generated route tree for TanStack Router
│   └── routes/           # File‑based routes
├── public/
│   └── assets/           # Static assets (logo, etc.)
├── components.json       # Shadcn UI component config
└── vite.config.ts        # Vite configuration
```

## Shared UI

All UI primitives live in `packages/_ui`. Import them like:

```tsx
import { Button } from "@modular-vsa/_ui/components/button";
```

## Build

```bash
bun run build:web   # Produces a static site in `dist/`
```

## Documentation

See the root **README.md** for the full monorepo overview and available scripts.
