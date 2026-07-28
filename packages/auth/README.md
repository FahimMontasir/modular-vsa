# Auth Package

Shared Better Auth configuration, authorization policy, and Elysia route protection.

## Purpose

This package wraps and configures `better-auth` for the entire application. It provides:

- A centralized server configured with the admin, username, and OpenAPI plugins
- One access-control statement and role map shared by server, browser client, and routes
- Permission-aware Elysia middleware and an idempotent administrator bootstrap

## What belongs here

- `src/access-control.ts` — shared statement, roles, and permission types
- `src/server/index.ts` — Better Auth server
- `src/server/auth-middleware.ts` — authentication and permission checks
- `src/server/bootstrap-admin.ts` — startup administrator provisioning
- `src/web/client.ts` — inferred Better Auth React client
- `src/web/pages` — login, account, and access-control pages powered directly by the Better Auth client
- Auth-specific server, policy, and browser integration

## Rules

- Route-level authentication should use `AuthMiddleware` and the shared resource names.
- Database schema for auth lives in `@modular-vsa/db` (not here).
- Configuration comes from `@modular-vsa/env/server` and `@modular-vsa/db`.

The initial roles are:

- `admin`: all Better Auth administration and application permissions.
- `director`: user list/get, session list, and post read only.

Email/password credentials use a shared 6–128 character length policy. Public sign-up remains
disabled.

## Usage

```ts
import { applicationActions } from "@modular-vsa/auth/access-control";
import { AuthMiddleware } from "@modular-vsa/auth/middleware";

// Use in route protection
const profile = secureAPI().get("/profile", ({ user }) => user, { authorize: true });
const posts = secureAPI().get("/posts", readPosts, {
  authorize: { post: [applicationActions.post.read] },
});
```

## Administrator bootstrap and migrations

The API validates `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`,
`BOOTSTRAP_ADMIN_USERNAME`, and `BOOTSTRAP_ADMIN_PASSWORD` and verifies or creates that administrator
before listening. Existing credentials are never rewritten. Identity conflicts and non-admin role
collisions stop startup.

Production deployments must run `bun run db:migrate` before starting the API. Local `bun dev` keeps
the existing development workflow: infrastructure startup followed by `db:push` and then the apps.
