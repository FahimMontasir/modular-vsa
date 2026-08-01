# Repository Instructions

## Skills

Load the matching skill from `.agents/skills/` before substantial work:

| Skill                     | When to load                                      |
| ------------------------- | ------------------------------------------------- |
| `modular-vsa-conventions` | Code, packages, database, API, or architecture    |
| `modular-vsa-ui`          | Routes, pages, components, styling, design system |
| `modular-vsa-testing`     | Tests, behavior changes, regressions              |

## Rules

- Follow nearest existing structure and style — no new abstractions without clear need.
- Use **Bun** for workspace tasks; use **npm** only in `tests/` for Playwright.
- Use **Context7** for version-sensitive third-party APIs before writing code.
- Run `bunx @tanstack/intent@latest list` before TanStack work; load the matching package skill.
- Compose TanStack's headless utilities with the shared shadcn/Base UI layer:
  - Form for editable workflows, typed values, validation, and submit state.
  - Table for sortable, filterable, selectable, or paginated tabular data.
  - Virtual for unbounded or measured-large collections, not ordinary paginated tables.
  - Pacer for deliberate debounce, throttle, queue, rate-limit, or batching behavior.
  - The shared shadcn Chart/Recharts wrapper for charts; do not add TanStack Charts.
- TanStack Table v8 and Virtual v3 expose imperative state that the React Compiler cannot always
  observe. Start their owning component with `"use no memo";` and keep input arrays stable until a
  compiler-compatible upstream release removes that requirement.

## Verification

1. Run the narrowest relevant test first, then broaden proportionally.
2. Run `bun run doctor --verbose --yes`, fix actionable findings, rerun to confirm.
3. Clean `react-doctor/` after final verification (keep only generated reports until then).
4. Run `bun test:all && bun run check` and visually verify changes in the browser.
