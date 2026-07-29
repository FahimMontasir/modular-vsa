# Portal end-to-end tests

This Node/npm package runs Playwright against the local portal and API. The repository remains
Bun-first, but Playwright itself is intentionally installed and invoked with npm.

## Prerequisites and commands

Docker Desktop, Bun, Vite+, Node.js, and the Playwright browser binaries must be available. From the
repository root:

```bash
npm --prefix tests ci
npx --prefix tests playwright install chromium
bun run test:e2e
```

Useful interactive commands are:

```bash
npm --prefix tests run test:ui
npm --prefix tests run test:debug
npm --prefix tests run test:show-report
```

Playwright starts `bun run dev` when needed. That command starts PostgreSQL, Redis, Garage, the API,
and the portal and pushes the tracked local schema. The configuration uses one worker so mutations
against these shared services remain deterministic.

## Authentication projects

`login-desktop` and `login-mobile` run `login.setup.ts` before their dependent browser projects.
The setup checks invalid credentials, username/email behavior, and redirect preservation, then
saves the bootstrap administrator state under `.auth/`. Desktop Chrome and Mobile Chrome never run
before their matching login project succeeds.

## Page matrix

| Page | Spec | Desktop Chrome | Mobile Chrome |
| --- | --- | --- | --- |
| Login | `login.setup.ts` | Validation, username/email login, redirect, saved state | Validation, username/email login, redirect, saved state |
| Home | `home.spec.ts` | Create, publish/update, upload, delete | Responsive smoke |
| Profile | `account-profile.spec.ts` | Update disposable name and username | Responsive smoke |
| Connections | `account-connections.spec.ts` | Inspect and unlink disposable credential | Responsive smoke |
| Security | `account-security.spec.ts` | Change disposable password/email, delete account | Responsive smoke |
| Account sessions | `account-sessions.spec.ts` | Create sessions, revoke, sign out | Responsive smoke |
| Users | `access-users.spec.ts` | Create, edit, role/password, ban/unban, impersonate, remove | Responsive smoke |
| Access sessions | `access-sessions.spec.ts` | Select identity, revoke one session, revoke all | Responsive smoke |
| Permissions | `access-permissions.spec.ts` | Allowed and denied local/server checks | Responsive smoke |
| Shared shell | `shared-shell.spec.ts` | Navigation, breadcrumbs, locale persistence | Responsive navigation |

Redirect-only account and access-control index routes are asserted in their destination-page specs.

## Fixture and cleanup policy

Mutation tests create unique users, posts, credentials, sessions, and object keys. Cleanup lives in
`try/finally` blocks or explicit fixture teardown and targets only captured IDs and keys. Bun fixture
scripts under `bun-fixtures/` provide direct access to Better Auth, Drizzle, and Garage when browser
APIs cannot safely establish prerequisite state. Do not truncate shared tables, flush Redis, clear a
bucket, or delete records by broad prefixes.

Generated authentication state, HTML reports, and test results are ignored by Git.
