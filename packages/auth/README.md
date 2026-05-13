# Auth Package

Authentication configuration and middleware for better-auth.

## Purpose

This package wraps and configures `better-auth` for the entire application. It provides:

- A centralized auth instance with database, environment, and security settings
- An Elysia middleware to protect server routes

## What belongs here

- `src/index.ts` — auth instance factory and exports
- `src/middleware/` — Elysia middleware for route protection
- Environment and database integration only

## Rules

- Do not add feature-specific auth logic here.
- Route-level authentication should use `AuthMiddleware` from this package.
- Database schema for auth lives in `@modular-vsa/db` (not here).
- Configuration comes from `@modular-vsa/env/server` and `@modular-vsa/db`.

## Usage

```ts
import { auth } from "@modular-vsa/auth";
import { AuthMiddleware } from "@modular-vsa/auth/middleware";

// Use in route protection
const app = secureAPI().get("/profile", ({ user, session }) => user, { authenticate: true });
```
