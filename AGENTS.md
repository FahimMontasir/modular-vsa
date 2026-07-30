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

## Verification

1. Run the narrowest relevant test first, then broaden proportionally.
2. Run `bun run doctor --verbose --yes`, fix actionable findings, rerun to confirm.
3. Clean `react-doctor/` after final verification (keep only generated reports until then).
4. Run `bun test:all && bun check --fix` and visually verify changes in the browser.
