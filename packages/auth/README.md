# Authentication

Shared Better Auth server/client configuration, authorization policy, route protection, and administrator bootstrap.

- `src/access-control.ts` owns permission resources and roles shared by server and browser code.
- `src/server/` owns Better Auth, `secureAPI`, authorization middleware, bootstrap, and notification hooks.
- `src/web/` owns the inferred client and auth/account/access-control pages.
- Auth forms use shared TanStack Form/shadcn bindings. User and session directories use feature-owned TanStack Table definitions, and user search is paced before querying Better Auth.
- Table owners keep state/data references stable and opt out of React Compiler memoization while the workspace is on TanStack Table v8.
- Keep auth tables in `_db` and runtime configuration in `__env__`.
- Protect routes with `secureAPI` and shared permission names; services must still enforce ownership rules.

`admin` has application and Better Auth administration permissions. `director` has limited read access. Public signup is disabled and password length is 6–128 characters.

The API validates and creates or verifies the `BOOTSTRAP_ADMIN_*` identity before listening. It never rewrites existing credentials and stops on identity or role conflicts. Production must run `bun run db:migrate` before startup.
