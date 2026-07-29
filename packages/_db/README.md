# Database

Drizzle schemas, relations, migrations, and the shared PostgreSQL connection.

- Organize `src/schema/` by feature and export every schema through the database factory.
- Treat schema definitions as the source of truth for derived validators and API types.
- Keep business logic, seeds, and feature services out of this package.
- Use schema push for local development only; generate and apply migrations in production.

```bash
bun run db:push
bun run db:generate
bun run db:migrate
bun run db:studio
```

Database commands load `apps/server/.env.local`; production must supply its own secrets.
