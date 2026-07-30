# Notifications

Durable inbox, direct messaging, platform threads, announcements, and Firebase delivery. PostgreSQL is authoritative; FCM is realtime transport only.

## Data and request flow

The Drizzle schema in `_db/src/schema/notification.ts` stores conversations, participants, messages, per-user read state, device registrations, delivery attempts, announcements, and targets.

`schema` → derived validators/types → controllers → services → PostgreSQL transaction → deterministic
BullMQ job → Firebase. Messages, recipients, and user-level outbox rows commit before enqueueing.
Each outbox row fans out into independently retryable per-FID targets, so one failing browser neither
suppresses another browser nor causes an accepted browser to receive a duplicate. Reconciliation
retries due rows if enqueueing or FCM fails. The portal always refetches authoritative API data after
a push.

- Controllers own paths, authorization, schemas, and OpenAPI metadata.
- Services enforce participant, sender, owner, and targeting rules and own transactions.
- All paths are centralized in `src/server/helpers/path.ts`.
- Delivery failures store sanitized codes only; message bodies and device tokens must not enter logs or analytics.
- Invalid FIDs are disabled; transient target failures use capped backoff.

## Web behavior

The Messenger UI shows announcements, platform threads, and direct conversations with a
database-backed unread count. Foreground FCM displays a system popup and invalidates React Query
data; the service worker displays background popups. Notification clicks focus an existing portal
window when possible and navigate only to safe internal paths. Modal open, focus, reconnect, and
resume reconcile the PostgreSQL-backed state.

Permission denial is non-blocking: messaging remains available without realtime push.

## Setup and tests

Configure the portal Firebase/VAPID values and runtime Admin credentials as described in
[`../_firebase/README.md`](../_firebase/README.md), then run `bun dev`. PostgreSQL, Redis, the
notification worker, and its one-minute reconciliation schedule must remain active. Production
requires applying generated migrations before the new worker code starts.

Pure delivery helpers use unit tests. `__tests__/integration/routes.test.ts` covers every notification HTTP operation with real local services and owned-fixture cleanup. Messenger and notification page behavior is covered by `tests/e2e/notification.spec.ts`.
