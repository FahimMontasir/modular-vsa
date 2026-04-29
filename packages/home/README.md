# @modular-vsa/home

`@modular-vsa/home` is the feature package for the Home domain.

It currently focuses on the server implementation for posts, with schema and type foundations for comments, with the following goals:

- keep the database schema as the source of truth
- derive runtime validation from the database schema
- derive TypeScript types from the validation layer
- keep route handlers thin and move business logic into services

This README is written for both humans and AI agents. If you are making changes here, read this first and follow the rules below.

## What this package exports

- `@modular-vsa/home/doc` → this README
- `@modular-vsa/home/*` → source modules from `src/*.ts`

The current public source entry is `src/index.ts`, which is intentionally minimal today.

## Package layout

```text
packages/home/
├── src/
│   ├── server/
│   │   ├── controllers/         # HTTP route definitions
│   │   ├── services/            # Database and business logic
│   │   ├── helpers/             # Normalization and small utilities
│   │   ├── validators/          # Elysia / TypeBox schemas
│   │   └── types.ts             # Static types inferred from schemas
│   ├── native/                  # Native-specific extension point
│   └── web/                     # Web-specific extension point
└── __tests__/
 └── unit/                    # Unit tests for package behavior
```

### `src/server`

This is the main implemented area of the package.

- `controllers/` defines Elysia routes and attaches request/response schemas.
- `services/` performs the actual database work.
- `helpers/` contains normalization and guard helpers shared by services.
- `validators/` builds schemas from the Drizzle database models.
- `types.ts` derives TypeScript types from the validation layer.

### `src/native` and `src/web`

These folders exist as platform-specific extension points. If you add platform behavior later, keep the logic isolated to the matching folder instead of leaking platform checks into the shared server code.

## Schema → validation → types

The most important rule in this package is that the database schema drives the API shape.

### Source of truth

The Home database schema lives in `packages/_db/src/schema/home.ts`.

That schema defines:

- `post`
- `comment`
- their columns and constraints
- table relations

### Validation layer

`src/server/validators/index.ts` uses `drizzle-typebox` to derive validation schemas from the Drizzle tables:

- `createInsertSchema(post)` → base insert schema
- `createSelectSchema(post)` → base select schema
- the same pattern for `comment`

Those generated schemas are then composed into `HomeSchema` for API use:

- `HomeSchema.Post`
- `HomeSchema.PostsList`
- `HomeSchema.CreatePost`
- `HomeSchema.UpdatePost`
- `HomeSchema.PostId`
- `HomeSchema.GetPostsQuery`
- `HomeSchema.DeletePostResponse`
- comment equivalents

### Type layer

`src/server/types.ts` derives TypeScript types from `HomeSchema` and the Drizzle models.

This means server code can reuse the same shapes for:

- request bodies
- route params
- query strings
- database records

### Why this matters

This flow keeps runtime validation and compile-time types aligned.

When the database changes, the generated schema changes with it, and the server types follow.

## Request flow

For most server endpoints, the flow is:

1. Route handler receives the request in `controllers/`.
2. Elysia validates `params`, `query`, `body`, and `response` using `HomeSchema`.
3. The controller calls a service in `services/`.
4. The service normalizes values in `helpers/` if needed.
5. The service reads or writes through `@modular-vsa/db`.
6. The validated response is returned to the client.

## Rules for contributors and AI agents

### 1. Change the database schema first

If a field changes, update `packages/_db/src/schema/home.ts` first.

Then update:

- `src/server/validators/index.ts`
- `src/server/types.ts`
- any affected helpers, services, and controllers

### 2. Keep controllers thin

Controllers should only:

- define the route
- attach validation schemas
- call the correct service

Do not put database logic inside controllers unless there is no better place.

### 3. Put persistence in services

Use `services/` for:

- inserts
- reads
- updates
- deletes
- database-specific error handling

### 4. Put normalization in helpers

Use `helpers/post.ts` for small data-shaping logic such as:

- trimming strings
- filling defaults
- removing empty update payloads
- throwing small reusable errors

### 5. Validate every API surface with `HomeSchema`

For new endpoints, always define:

- `params` when the route has path parameters
- `query` when the route accepts filters or options
- `body` for write operations
- `response` for the returned payload

If a schema already exists, reuse it instead of creating a parallel shape.

### 6. Keep derived types derived

Do not hand-write duplicate request or response types if they can be inferred from `HomeSchema`.

### 7. Preserve the source-of-truth chain

The intended order is:

`Drizzle schema` → `drizzle-typebox` validators → `Elysia` route validation → `TypeScript` types

If you break this chain, the package becomes harder to maintain and easier to drift.

## Existing conventions in this package

- `HomeRoutes` composes all route groups under `/home`.
- `PostCreateRoutes`, `PostReadRoutes`, `PostUpdateRoutes`, and `PostDeleteRoutes` define CRUD behavior.
- `readPosts` supports optional title and published filters.
- `requireOne` and `requirePayload` are used to fail fast when a DB result or update payload is empty.
- `ApiError` is used for consistent HTTP errors.

## Common changes

### Add a new post field

1. Update `packages/_db/src/schema/home.ts`.
2. Regenerate or update the derived schemas in `src/server/validators/index.ts`.
3. Update inferred types in `src/server/types.ts` if needed.
4. Adjust normalization in `helpers/post.ts`.
5. Update services and routes to use the new field.

### Add a new endpoint

1. Add or reuse a schema in `HomeSchema`.
2. Add a controller in `src/server/controllers/`.
3. Move persistence logic into `src/server/services/`.
4. Keep route-specific normalization in `src/server/helpers/`.

### Add or change comment behavior

Comments already have database schema support and validation/type foundations. Follow the same pipeline used by posts:

- start with the DB table
- derive validation
- derive types
- add controller/service logic

## Validation and scripts

This package has its own checks:

- `bun run check` → lint, format, and type-check this package
- `bun run test:unit` → run unit tests under `__tests__/unit`

## Notes for AI agents

If you are updating code in this package:

- prefer changing the database schema first when data shape changes
- keep route handlers minimal
- do not invent new validation shapes when `HomeSchema` already covers the case
- avoid editing unrelated files when the task is documentation-only
- treat `src/native` and `src/web` as intentional extension points, not as part of the server implementation unless the task explicitly says so

## Maintenance

This document should stay aligned with the current package state.

If the package grows new server modules, update this README so the folder map and schema flow remain accurate.
