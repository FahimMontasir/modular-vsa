# DB Package

Database schema and connection management with Drizzle ORM.

## Purpose

This package is the **single source of truth** for:

- Database schema definitions
- Database connection factory
- Schema exports for ORM and migrations

## What belongs here

- `src/schema/` — all table and relation definitions
- `src/index.ts` — database connection factory and exports
- `drizzle.config.ts` — Drizzle kit configuration for migrations

## Rules

- Keep schema organized by feature (e.g., `auth.ts`, `home.ts`).
- All schema exports must be bundled (in createDb) for external use.
- Do not put migrations, seeds, or business logic here—only schema.
- Migrations will generated automatically by running `bun run db:push` after schema changes.
- Feature packages can define their own schemas in this folder

## Usage

```ts
import { db } from "@modular-vsa/db";
import { user } from "@modular-vsa/db/schema/auth";

// Use the database instance
const users = await db.select().from(user);
```

## Migrations

```bash
# Push migrations to database
bun run db:push

# Open Drizzle Studio to inspect data
bun run db:studio
```
