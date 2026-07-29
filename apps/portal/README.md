# Portal (web)

The web front-end for the **modular-vsa** monorepo, built with Vite+, React, and TanStack Router.

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

## Messenger, notifications, and telemetry

The authenticated shell mounts the `@modular-vsa/notification` Messenger modal. Its account-menu
badge is the authoritative PostgreSQL unread total. Desktop renders a centered two-pane dialog;
mobile fills the viewport above the existing bottom navigation. A Home-page warning requests FCM
permission without blocking portal access.

FCM is the only realtime transport. Foreground messages invalidate React Query caches, while modal
open, focus, reconnect, and app resume perform one-shot database reconciliation. The custom service
worker at `src/sw.ts` displays background pushes and routes clicks to the selected conversation.

Firebase Analytics and Performance Monitoring lazy-load after hydration. Route telemetry is
normalized and anonymous; do not log content or identifiers. See
`packages/notification/README.md` and `packages/_firebase/README.md` for setup and troubleshooting.

## Build

```bash
bun run build # Produces a static site in `dist/`
```

## Documentation

See the root **README.md** for the full monorepo overview and available scripts.
