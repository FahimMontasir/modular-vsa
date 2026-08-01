# UI

Shared Base UI/shadcn primitives, Tailwind theme tokens, and reusable browser hooks.

- `src/styles/globals.css` owns colors, typography, radius, dark mode, and Tailwind tokens.
- `src/components/` owns framework-agnostic primitives; feature composition stays in feature packages.
- Import components as `@modular-vsa/ui/<component>`, hooks as `@modular-vsa/ui/hooks/<hook>`, utilities from `@modular-vsa/ui/lib/utils`, and CSS from `@modular-vsa/ui/globals.css`.
- Reuse existing primitives and variants before adding new ones. Use `cn` for class merging, CVA for reusable variants, and Lucide for icons.
- Preserve semantics, keyboard access, visible focus, responsive behavior, dark mode, and RTL support.
- Use `@modular-vsa/ui/form` for shared TanStack Form bindings. Features own values, validators, submissions, and localized errors.
- Render feature-owned TanStack Table definitions with `@modular-vsa/ui/table`.
- Use TanStack Virtual only for unbounded or measured-large collections and Pacer only when execution timing is explicit product behavior.
- TanStack Table v8 and Virtual v3 owners use `"use no memo";` with the React Compiler. Virtual scrollports need a concrete size (and an `initialRect` when their first measurement can occur after mount).
- Keep charts on `@modular-vsa/ui/chart`, which wraps Recharts; TanStack Charts is not part of this workspace.
- Run TanStack Intent discovery and fetch current Context7 documentation before changing these integrations.

Add shared primitives from the repository root:

```bash
bun run add:ui -- dialog popover table
```

The shadcn configuration is `components.json`: Base UI (`base-nova`), neutral base color, CSS variables enabled, and RSC disabled.
