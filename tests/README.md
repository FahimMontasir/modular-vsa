# Testing

Use the lowest suite that reaches the public behavior under test.

## Boundaries

- **Unit:** deterministic package logic with `bun:test` under `__tests__/unit`; no database, Redis, Garage, Firebase, network, Docker, or browser.
- **Integration:** every first-party Elysia HTTP operation through the package route object and typed Eden client in `__tests__/integration/routes.test.ts`; real local infrastructure, unique fixtures, targeted cleanup.
- **E2E:** every reachable portal page with Playwright under `tests/e2e`; navigate and assert visible behavior with accessible locators and web-first assertions.

Do not test internal call order or mock project modules. Never truncate shared tables, flush Redis, clear buckets, delete broad prefixes, or use fixed sleeps. E2E tests run fully parallel, so create disposable data and clean it in hooks or `finally` blocks through public APIs or existing Bun fixtures.

Layout and redirect-only routes are covered through destination pages. The `login` Playwright project prepares reusable administrator browser state before authenticated specs.

## Run

```bash
bun run test:unit
bun run test:integration
bun run test:e2e
bun run test:all
```

Playwright is intentionally npm-managed:

```bash
npm --prefix tests ci
npx --prefix tests playwright install chromium
npm --prefix tests run test:ui
```

`bun run test:e2e` starts `bun dev` when required. Generated auth state, reports, and results are ignored by Git.
