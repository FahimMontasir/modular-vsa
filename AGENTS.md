# Repository Instructions

- Follow the nearest existing structure and style; do not introduce a new layer or abstraction without a demonstrated need.
- Before substantial work, inspect `.agents/skills/` and load the most specific matching skill completely.
- Load `modular-vsa-conventions` for code, package, database, API, or architecture changes.
- Load `modular-vsa-ui` for routes, pages, components, styling, or design-system changes.
- Load `modular-vsa-testing` whenever behavior, routes, pages, or tests change.
- Run `bunx @tanstack/intent@latest list` at the workspace root before relevant TanStack work; load the matching package skill before editing.
- Use Context7 for version-sensitive third-party APIs: confirm the installed version, resolve the official library, then query the specific API.
- Use Bun for workspace tasks and Vite+ for formatting, linting, types, builds, and orchestration. Use npm only in `tests/` for Playwright.
- Run the narrowest relevant test first, then broader checks proportional to the change.
- React Doctor reports live in `react-doctor/`. Read `diagnostics.json` completely plus each relevant per-rule `.txt` file before fixing findings, and treat a shared `fixGroupId` as one root cause.
- At the very end, run `bun run doctor --verbose --yes`, fix the requested actionable findings by severity, and rerun it to confirm the improvements.
- After the requested fixes and validations pass, confirm `react-doctor/` contains only generated `diagnostics.json`, `deslop--*.txt`, and `react-doctor--*.txt` reports, then delete every file in that folder. Do not delete the reports before final verification.
