# Background jobs

BullMQ queues, workers, and Bun cron schedules backed by Redis.

- Define typed job payloads under `src/def/` and register them in `src/registry.ts`.
- Keep queue/worker infrastructure in `src/core/`; keep domain processing with its job definition.
- Use deterministic job IDs for idempotent delivery and retry safety.
- Start workers through `startAllWorkers()` from the server composition root.
- Keep schedules idempotent because multiple server instances may attempt the same work.

Notification jobs deliver the durable PostgreSQL outbox through Firebase. Transient failures retry with capped backoff; invalid registrations are disabled; reconciliation re-enqueues due rows.

Redis configuration comes from `@modular-vsa/env/server`. `bun dev` starts the local Redis service.
