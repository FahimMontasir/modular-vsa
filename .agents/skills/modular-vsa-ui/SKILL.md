---
name: modular-vsa-ui
description: Build Modular VSA React pages and components with its shared Base UI/shadcn design system, Tailwind tokens, TanStack Router, Lingui, and React Query patterns. Use for portal routes, feature web code, shared UI primitives, styling, responsive layouts, accessibility, or visual changes.
---

# Modular VSA UI

## Start from the system

1. Inspect the nearest feature page and existing primitives in `packages/_ui/src/components`.
2. Load the repo `shadcn`, `frontend-design`, and React performance skills when relevant.
3. Reuse a shared primitive before creating a new one. Add reusable primitives to `_ui`; keep feature composition in the feature package.

## Keep ownership clear

- Keep `apps/portal/src/routes` files thin: declare the TanStack file route and render a feature-owned page.
- Put domain pages and components under `packages/<feature>/src/web`.
- Put cross-feature shells and web helpers in `packages/__shared__/src/web` only when genuinely shared.
- Import primitives as `@modular-vsa/ui/<component>` and utilities from `@modular-vsa/ui/lib/utils`.
- Never edit generated `routeTree.gen.ts`.

## Use the design system

- Treat `packages/_ui/src/styles/globals.css` as the source of truth for colors, typography, radius, dark mode, and Tailwind theme tokens.
- Compose Base UI/shadcn primitives; use `cn` for class merging and CVA for reusable variants.
- Use Lucide icons and existing component sizes, spacing, and states.
- Use `Field` for form layout, `InputGroup` for inline addons/actions, and `Item` for content rows.
- Choose overlays by behavior: `Tooltip`, `HoverCard`, `Popover`, `Dialog`, then `Sheet`/`Drawer`.
- Use `Alert`, `Sonner`, `Skeleton`, `Spinner`, and `Empty` for their existing feedback roles.

## Choose TanStack utilities by behavior

- Use `@modular-vsa/ui/form` for editable workflows. Keep values, validators, API calls, resets, and localized errors in the feature.
- Use TanStack Table for genuinely tabular data that needs sorting, filtering, selection, pagination, or reusable column state; render it with `@modular-vsa/ui/table`.
- Use TanStack Virtual for unbounded or measured-large collections. Supply stable domain IDs, realistic estimates, measured rows, overscan, and `useFlushSync: false` under React 19.
- Give virtual scrollports a concrete size and provide `initialRect` when the first real measurement can occur after mount.
- Put `"use no memo";` at the top of TanStack Table v8 and Virtual v3 owner components because their imperative state reads can be hidden from the React Compiler. Remove it only after verifying a compiler-compatible upstream release.
- Use TanStack Pacer when debounce, throttle, rate limiting, queueing, or batching is intentional product behavior. Do not duplicate timing already owned by Form or Query.
- Use the shared shadcn Chart/Recharts wrapper for visualization. Do not introduce TanStack Charts.
- Before TanStack changes, run Intent discovery and use Context7 for installed-package APIs.

## Build complete interfaces

- Localize user-facing copy with Lingui macros.
- Use semantic elements, labels, keyboard access, visible focus, and accessible role/name selectors.
- Support mobile and desktop using existing breakpoints; preserve dark mode and RTL compatibility.
- Represent loading, empty, error, disabled, and success states explicitly.
- Keep remote server state in React Query and invalidate authoritative queries after mutations or realtime signals.
- Avoid duplicating server data in effects or local state.

## Verify

- Add page-level Playwright coverage for each new user-facing page and behavioral change.
- Load `$modular-vsa-testing`, run the narrowest relevant test, then run `bun run check`.
