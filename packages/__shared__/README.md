# Utils Package

Shared utility functions and helpers for client, server, and common logic across the monorepo.

## Structure

```txt
src/
  client/        - Browser/client-only utilities
  server/        - Server-only utilities
  common/        - Runtime-agnostic shared utilities
__tests__/unit/  - Unit tests (mirrors src structure)
```

## What belongs here

- Reusable, single-purpose utility functions
- Error classes and handlers (server)
- Date/time helpers (common)
- Client-specific helpers (client)
- Server-specific helpers like middleware factories (server)

## What does NOT belong here

- Feature-specific logic (belongs in feature packages)
- Configuration or constants (belongs in `@modular-vsa/env` or package-scoped config)
- Business domain logic (belongs in feature packages)
- UI components (belongs in `@modular-vsa/ui`)

## Rules

- Keep utilities small, single-responsibility, and reusable.
- Utilities in `server/` can only be imported by server-side code.
- Utilities in `client/` can only be imported by client-side code.
- Utilities in `common/` can be imported everywhere.
- No cross-dependencies: a common utility cannot import server or client utilities.
- Test your custom functions, not library implementations (e.g., Elysia).
