# UI Package

Shared, framework‑agnostic UI primitives built with **shadcn/ui** and styled via TailwindCSS.

## Purpose

- Provide a single source of UI components (`Button`, `Card`, etc.) that can be used across the web and native apps.
- Keep design tokens, global CSS, and component defaults centralized.

## Structure

```text
packages/_ui/
├── src/
│   ├── components/   # Individual UI components (e.g., button.tsx)
│   └── styles/       # Global TailwindCSS styles (`globals.css`)
├── components.json   # shadcn UI configuration file
├── postcss.config.mjs
└── package.json
```

## Usage

```tsx
import { Button } from "@modular-vsa/_ui/components/button";

export default function Example() {
  return <Button>Click me</Button>;
}
```

The UI package does **not** contain any platform‑specific code; it works both in the web Vite app and the React‑Native Expo app (via the same component source).

## Adding Components

Run the shadcn CLI from the package root:

```bash
bunx shadcn@latest add <component> -c .
```

The new component will be scaffolded under `src/components/` and automatically added to `components.json`.

## Documentation

See the root **README.md** for the overall monorepo overview and the scripts to generate code, build, and test.
