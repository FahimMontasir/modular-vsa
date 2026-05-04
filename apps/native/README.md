# Native App

The React Native / Expo front‑end for the **modular‑vsa** monorepo.

## Development

```bash
bun install
bun run dev:native   # Starts Expo Metro server
```

Open the Expo Go app on your device or simulator and scan the QR code printed in the terminal.

## Project Layout

```text
apps/native/
├── app/                     # Expo Router application entry
│   ├── _layout.tsx          # Root layout
│   ├── modal.tsx           # Global modal component
│   └── (drawer)/           # Drawer navigation with tabs
│       ├── _layout.tsx
│       └── (tabs)/
│           ├── _layout.tsx
│           └── index.tsx
├── components/             # Shared UI components used by native app
│   ├─ container.tsx
│   ├─ sign‑in.tsx
│   └─ …
├── contexts/               # React context providers (e.g., theme)
│   └─ app‑theme‑context.tsx
├── lib/                    # Low‑level helpers such as auth client
│   └─ auth‑client.ts
├── assets/                 # Image assets
└── global.css              # Global stylesheet
```

## Shared UI

All cross‑platform UI primitives live in `packages/_ui`. Import them like:

```tsx
import { Button } from "@modular-vsa/ui/components/button";
```

## Build

```bash
bun run build:native   # Produces a production bundle for Expo
```

## Documentation

See the root **README.md** for the full monorepo overview and scripts.
