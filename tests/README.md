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
and the portal and pushes the tracked local schema. The configuration runs the desktop suite with
four workers and enables full parallelism. Mutation tests use unique fixtures and targeted cleanup
so they can safely share these services.

## Authentication projects

The `login` project runs `login.setup.ts` before the `Desktop Chrome` project. It verifies the
unauthenticated redirect, installs a bootstrap administrator session through the shared Bun fixture,
then saves that browser state under `.auth/`. This avoids making every desktop test depend on the
rate-limited sign-in form. The desktop tests do not run until authentication setup succeeds.

## Page matrix

| Page | Spec | Desktop Chrome |
| --- | --- | --- |
| Login | `login.setup.ts` | Unauthenticated redirect and saved administrator state |
| Home | `home.spec.ts` | Create, publish/update, upload, delete |
| Profile | `account-profile.spec.ts` | Update disposable name and username |
| Connections | `account-connections.spec.ts` | Inspect and unlink disposable credential |
| Security | `account-security.spec.ts` | Change disposable password/email, delete account |
| Account sessions | `account-sessions.spec.ts` | Create sessions, revoke, sign out |
| Users | `access-users.spec.ts` | Create, edit, role/password, ban/unban, impersonate, remove |
| Access sessions | `access-sessions.spec.ts` | Select identity, revoke one session, revoke all |
| Permissions | `access-permissions.spec.ts` | Allowed and denied local/server checks |
| Notifications | `notification.spec.ts` | Unread state, direct messages, announcements, desktop dialog geometry |
| Shared shell | `shared-shell.spec.ts` | Navigation, breadcrumbs, locale persistence |

Redirect-only account and access-control index routes are asserted in their destination-page specs.

## Fixture and cleanup policy

Mutation tests create unique users, posts, credentials, sessions, and object keys. Cleanup lives in
`try/finally` blocks or explicit fixture teardown and targets only captured IDs and keys. Bun fixture
scripts under `bun-fixtures/` provide direct access to Better Auth, Drizzle, and Garage when browser
APIs cannot safely establish prerequisite state. Do not truncate shared tables, flush Redis, clear a
bucket, or delete records by broad prefixes.

Generated authentication state, HTML reports, and test results are ignored by Git.
