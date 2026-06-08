# Portal (web)

The web front‑end for the **modular‑vsa** monorepo, built with Vite, React and TanStack Router.

## Project Layout

```text
apps/portal/
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
import { Button } from "@modular-vsa/ui/components/button";
```

## Build

```bash
bun run build:web   # Produces a static site in `dist/`
```

## Documentation

See the root **README.md** for the full monorepo overview and available scripts.
