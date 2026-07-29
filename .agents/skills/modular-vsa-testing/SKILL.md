---
name: modular-vsa-testing
description: Apply Modular VSA's test boundaries and existing Bun, Eden, and Playwright patterns. Use when changing behavior, adding or updating tests, exposing Elysia routes, creating portal pages, fixing regressions, or deciding whether coverage belongs in unit, route-integration, or E2E tests.
---

# Modular VSA Testing

## Choose the public seam

- Test observable behavior through a stable public interface, not private implementation details.
- Use one of three suites: dependency-free logic, first-party HTTP routes, or user-facing pages.
- Keep fixtures unique and assertions independent from the implementation.

## Unit: logic without external dependencies

- Use `bun:test` under the owning package's `__tests__/unit` directory.
- Test deterministic functions, validation helpers, policies, normalization, error mapping, and state transitions.
- Do not require PostgreSQL, Redis, Garage, Firebase, network access, Docker, or a browser.
- Do not mock internal modules or assert call order. Inject and fake only unavoidable system boundaries.
- Run a package test directly or use `bun run test:unit` for the workspace.

## Integration: every first-party route

- Reserve `__tests__/integration/routes.test.ts` for packages that expose Elysia routes.
- Cover every public HTTP operation through the package's composed route object and typed Eden `treaty` client.
- Use the existing authenticated-client helper and real local infrastructure; do not test services directly in this suite.
- Assert the response status/error and the behavior callers observe. Add authorization or validation cases when they define route behavior.
- Generate unique fixture values, track every created ID/key, and clean up in hooks or `finally` blocks.
- Delete only owned records and objects. Never truncate tables, flush Redis, clear buckets, or delete broad prefixes.
- Run `bun run test:integration`, which starts infrastructure and pushes the local schema first.

## E2E: every user-facing page

- Keep Playwright specs in `tests/e2e`; every reachable portal page needs behavioral coverage.
- Cover layout and redirect-only routes through their destination pages, not empty standalone tests.
- Navigate through the UI and assert visible outcomes with roles, labels, and web-first assertions.
- Reuse the saved administrator state and existing auth helpers. Create disposable identities when permissions or account state differ.
- Do not use fixed sleeps. Keep tests independent and safe under full parallelism.
- Clean up through public APIs or the existing Bun fixtures, targeting captured identifiers only.
- Run `bun run test:e2e`; use npm only for commands defined inside `tests/`.

## Finish

1. Run the narrowest new or changed test until it passes.
2. Run the affected suite: `bun run test:unit`, `bun run test:integration`, or `bun run test:e2e`.
3. Run `bun run test:all` when the change crosses layers or before full release validation.
4. Run `bun run check` for source changes.
