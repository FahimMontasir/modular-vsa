# Notifications

Durable inbox, direct messaging, platform threads, announcements, and Firebase delivery. PostgreSQL is authoritative; FCM is realtime transport only.

## Data and request flow

The Drizzle schema in `_db/src/schema/notification.ts` stores conversations, participants, messages, per-user read state, device registrations, delivery attempts, announcements, and targets.

`schema` → derived validators/types → controllers → services → PostgreSQL transaction → deterministic BullMQ job → Firebase. Messages, recipients, and outbox rows commit before enqueueing; reconciliation retries due rows if enqueueing or FCM fails. The portal always refetches authoritative API data after a push.

- Controllers own paths, authorization, schemas, and OpenAPI metadata.
- Services enforce participant, sender, owner, and targeting rules and own transactions.
- All paths are centralized in `src/server/helpers/path.ts`.
- Delivery failures store sanitized codes only; message bodies and device tokens must not enter logs or analytics.
- Invalid registrations are disabled; transient failures use capped backoff.

## Web behavior

The Messenger UI shows announcements, platform threads, and direct conversations with a database-backed unread count. Foreground FCM, modal open, focus, reconnect, and resume invalidate React Query data. The service worker renders background notifications and opens safe internal action paths.

Permission denial is non-blocking: messaging remains available without realtime push.

## Setup and tests

Configure portal Firebase/VAPID values and local Admin credentials as described in [`../_firebase/README.md`](../_firebase/README.md), then run `bun dev`. Production requires generated migrations plus active workers and reconciliation schedules.

Pure delivery helpers use unit tests. `__tests__/integration/routes.test.ts` covers every notification HTTP operation with real local services and owned-fixture cleanup. Messenger and notification page behavior is covered by `tests/e2e/notification.spec.ts`.
