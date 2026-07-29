---
name: modular-vsa-conventions
description: Follow Modular VSA's repository structure, TypeScript style, package boundaries, and backend data/API architecture. Use for changes to apps, packages, Elysia routes, Drizzle schemas, services, shared utilities, configuration, or cross-package interfaces.
---

# Modular VSA Conventions

## Work from local patterns

1. Inspect the affected package and its nearest analogous implementation.
2. Keep changes in the owning package and preserve its public boundary.
3. Load the most specific matching repo skill before substantial work.
4. For relevant TanStack packages, run Intent discovery from the workspace root and load the matching package skill.
5. Use Context7 when current third-party API behavior affects the change.

## Place code correctly

- Keep application composition in `apps/portal` and `apps/server`.
- Keep domain behavior in feature packages such as `auth`, `home`, and `notification`.
- Keep database schemas and the connection in `_db`, environment parsing in `__env`, reusable runtime utilities in `__shared__`, UI primitives in `_ui`, storage in `_storage`, jobs in `_jobs`, Firebase adapters in `_firebase`, and localization in `_i18n`.
- Share code only after more than one package needs the same stable abstraction. Do not move feature logic into shared packages.
- Keep browser code out of server modules and database imports out of `src/web`.
- Import concrete modules through package exports. Do not add barrel files.

## Build backend features

- Treat the Drizzle schema as the data-model source of truth.
- Derive TypeBox validation with `drizzle-typebox`, then infer TypeScript types from validators.
- Keep Elysia controllers limited to paths, authorization, schemas, OpenAPI metadata, and service calls.
- Put persistence and business operations in `services/`; put normalization and small guards in `helpers/`.
- Compose a package's controllers in `controllers/routes.ts`, then mount its route object in `apps/server/src/v1-routes.ts`.
- Reuse `secureAPI`, shared permissions, and `ApiError`; use the shared logger instead of `console`.
- Keep production database changes migration-driven. Use `db:push` only for local development.

## Match enforced style

- Write strict TypeScript with inferred types where clear; avoid unsafe casts and duplicated schema types.
- Use named function declarations. Do not reassign parameters or leave floating promises.
- Use double quotes, semicolons, two-space indentation, 100-column formatting, and trailing commas where supported.
- Group imports as external, `@modular-vsa/*`, then relative imports; let Vite+ sort them.
- Prefer small, single-purpose modules and explicit public imports.

## Verify narrowly

- Use Bun for workspace scripts and package tests; use npm only inside `tests/` for Playwright.
- Run the narrowest affected test first, then `bun run check` for code changes.
- Load `$modular-vsa-testing` whenever behavior, routes, pages, or tests change.
