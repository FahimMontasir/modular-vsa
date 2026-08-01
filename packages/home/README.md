# Home

Feature package for Home pages and post/comment APIs.

## Server flow

`_db/src/schema/home.ts` → derived TypeBox validators → inferred types → thin Elysia controllers → services and helpers.

- `controllers/` declares routes, authorization, validation, and responses.
- `services/` owns persistence and business operations.
- `helpers/` owns normalization and small guards.
- `validators/` derives API schemas from Drizzle; do not duplicate request or response shapes.
- `controllers/routes.ts` composes the package route object under `/home`.

When a data shape changes, update the Drizzle schema first, then validators/types, helpers, services, controllers, and route integration coverage.

## Web and tests

`src/web/pages` owns Home UI rendered by thin portal routes. Editable post and upload workflows use shared TanStack Form/shadcn bindings; post cards remain feature composition rather than tabular data. Unit tests cover pure helpers; `__tests__/integration/routes.test.ts` covers every Home HTTP operation through Eden with real local infrastructure and targeted cleanup. Page behavior belongs in `tests/e2e/home.spec.ts`.
