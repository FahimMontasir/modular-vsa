# `@modular-vsa/notification`

Durable notifications and one-to-one messaging for Modular VSA. PostgreSQL is the source of truth;
Firebase Cloud Messaging (FCM) is the only realtime delivery channel. The package follows the Home
package layout: thin Elysia controllers, database-focused services, TypeBox validators, inferred
types, web query hooks, and feature-owned React components.

The controller layer mirrors `@modular-vsa/home` directly:

```text
src/server/controllers/
├── create.ts  # direct conversations, messages, announcements
├── read.ts    # conversations, unread count, users, history, announcements
├── update.ts  # read state, device registration, cancellation
├── delete.ts  # message/device/announcement removal
└── routes.ts  # prefix, OpenAPI tag, and controller composition only
```

All paths are declared in `src/server/helpers/path.ts`. Each operation controller owns its HTTP
method, authorization declaration, request/response schemas, and OpenAPI details; persistence remains
in services.

## Data model

The Drizzle schema is `packages/_db/src/schema/notification.ts` and its generated SQL migrations are
under `packages/_db/src/migrations`.

| Table                                   | Purpose                                                                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `notification_conversation`             | Direct, platform-source, and global announcement threads. The direct key contains a sorted user pair.                   |
| `notification_conversation_participant` | Thread membership and the canonical direct-chat pairing.                                                                |
| `notification_message`                  | Text, title, safe internal action path, sender, timestamps, and audit-preserving soft deletion.                         |
| `notification_message_recipient`        | Per-user visibility and read state.                                                                                     |
| `notification_device_registration`      | Authenticated user/Firebase Installation ID association, device metadata, last-seen, and disable time.                  |
| `notification_delivery`                 | Durable per-message/per-recipient Firebase outbox with attempts, retry time, acceptance time, and sanitized error code. |
| `notification_announcement`             | Draft/scheduled/sending/sent/cancelled lifecycle, schedule, message link, and soft deletion.                            |
| `notification_announcement_target`      | Everyone, exact role, or user targeting rules.                                                                          |

Messages, recipients, and delivery rows are committed in one PostgreSQL transaction before a job is
enqueued. If enqueueing or FCM is unavailable, the minutely reconciler finds pending/retryable rows.
An FCM notification always carries stable conversation/message IDs; the portal refetches the API and
never treats the push payload as authoritative content.

## HTTP API

All routes are authenticated and mounted at `/api/v1/notification`. Services also enforce
participant, sender, and owner rules; access-control declarations alone are not trusted.

| Method     | Route                                        | Description                                                                    |
| ---------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| `GET`      | `/conversations`                             | Ordered threads: Announcements, platform sources, then recent DMs.             |
| `GET`      | `/unread`                                    | Combined unread recipient count.                                               |
| `GET`      | `/users?q=`                                  | Safe user lookup for starting a DM.                                            |
| `POST`     | `/direct`                                    | Create or return a canonical one-to-one conversation.                          |
| `GET`      | `/conversations/:id/messages?cursor=&limit=` | Cursor-paginated visible history with deletion tombstones.                     |
| `POST`     | `/conversations/:id/messages`                | Persist a text-only DM and Firebase outbox rows atomically.                    |
| `POST`     | `/conversations/:id/read`                    | Mark visible messages read through a stable message ID.                        |
| `DELETE`   | `/messages/:id`                              | Soft-delete the sender's message; announcement deletion requires admin access. |
| `PUT`      | `/devices`                                   | Register or refresh this user's FID.                                           |
| `DELETE`   | `/devices`                                   | Detach this user's FID before sign-out.                                        |
| `GET/POST` | `/announcements`                             | Admin list/create draft or scheduled announcements.                            |
| `POST`     | `/announcements/:id/cancel`                  | Cancel an owned scheduled announcement.                                        |
| `DELETE`   | `/announcements/:id`                         | Admin soft deletion.                                                           |

Server modules publish trusted platform events with:

```ts
import { publishPlatformNotification } from "@modular-vsa/notification/server";

await publishPlatformNotification({
  source: "security",
  title: "Session changed",
  body: "Review your active sessions.",
  recipientIds: [userId],
  actionUrl: "/account/sessions",
});
```

Initial source keys are `account`, `security`, `content`, and `system`; additional server modules can
use a new stable key. Browsers have no platform-publish endpoint. Better Auth lifecycle hooks publish
verified account/security events server-side.

## Firebase outbox lifecycle

1. A service transaction stores the message, recipient snapshot, and `pending` delivery rows.
2. BullMQ receives a deterministic `fcm-<delivery-id>` job.
3. The worker resolves active registered FIDs and calls Firebase Admin Messaging in batches of 500.
4. Any accepted device changes the recipient delivery to `accepted` and records `acceptedAt`.
5. Invalid/unregistered FIDs are disabled. Transient Firebase codes use capped exponential delay;
   permanent failures become `failed`. Only sanitized Firebase error codes are stored.
6. A minutely reconciliation schedule re-enqueues due `pending`/`retry` rows and due announcements.

`accepted` means Firebase accepted the send. Web FCM has no device-display, delivery, or read receipt,
so the application never labels it “delivered.” A missing active registration becomes `skipped` while
the database inbox remains available.

Announcements resolve their target rules only when dispatch starts, then snapshot participants,
recipient rows, and delivery rows in the dispatch transaction. Scheduled times arrive as browser-local
`datetime-local` values and are serialized to UTC by the API client.

## Web behavior

- The account trigger and Messenger row show a combined unread badge capped at `99+`.
- Desktop uses a centered bounded two-pane dialog. Mobile uses the screen above the existing
  five-rem bottom navigation area.
- The Announcements thread is always first, followed by per-source platform threads and DMs.
- Foreground FCM invalidates unread, conversation, and affected history queries.
- Modal open, focus, reconnect, and app resume invalidate authoritative database queries. These are
  recovery checks, not polling or a second realtime transport.
- Background data payloads are rendered by the custom InjectManifest service worker. Clicking opens
  `/?messenger=<conversation-id>` and selects the requested thread.
- The Home warning explicitly requests permission. Denial is non-blocking but explains that realtime
  alerts cannot arrive. A granted FID refreshes automatically; sign-out detaches it first.

There are intentionally no SSE endpoints, EventSource clients, WebSockets, Redis pub/sub, timed inbox
polling, group chat, attachments, typing, presence, reactions, edits, or sender-visible receipts.

## Analytics

Firebase Analytics lazy-loads after hydration. Every TanStack route emits a normalized `screen_view`.
Safe notification events include permission outcome and messenger/announcement outcomes.

Never add IDs, FIDs, names, emails, search text, message/post/announcement bodies, or arbitrary URLs to
Analytics. `sanitizeTelemetryParams` only accepts normalized event names/keys and short safe scalar
values. Database identifiers are used for cache invalidation and FCM data routing only, never Analytics.

| Signal                                    | Safe dimensions / scope                                                             |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| `screen_view`                             | Normalized route path only.                                                         |
| `auth_action`                             | Action, method when relevant, and success/failed outcome.                           |
| `account_action`, `security_action`       | Normalized action and outcome.                                                      |
| `home_action`                             | Create/update/delete action and outcome; never post content or ID.                  |
| `notification_permission`                 | Granted/denied/default outcome.                                                     |
| `messenger_action`, `announcement_action` | Normalized action and outcome; never conversation, message, user, or target values. |

Server-side message persistence, FCM dispatch, and announcement fan-out are observable through durable
outbox timestamps/statuses and structured worker logs.

## Local setup and troubleshooting

1. Configure the public `VITE_FIREBASE_*` values and VAPID key in `apps/portal/.env.local`.
2. Provide ignored Firebase Admin credentials through `packages/_firebase/service-key.json`, explicit
   server environment values, or Application Default Credentials.
3. Run `bun install`, `bun run db:migrate`, then `bun dev`.
4. Use HTTPS outside localhost. Confirm the generated service worker is registered and notification
   permission is not blocked in browser site settings.

If a push is missing, inspect `notification_delivery`: `pending/retry` indicates reconciliation will
retry, `failed` contains a sanitized permanent code, `skipped` means no active FID, and `accepted` only
confirms FCM acceptance. Open/focus Messenger to verify the database record independently of FCM.

Validation commands:

```bash
bun run check
bun -F @modular-vsa/notification test:unit
bun -F @modular-vsa/jobs test:unit
bun -F @modular-vsa/firebase test:unit
bun -F @modular-vsa/i18n intl:extract
bun -F @modular-vsa/i18n intl:compile
bun -F @modular-vsa/portal build
```

## Test coverage

- `__tests__/integration/routes.test.ts` exercises every authenticated Elysia controller route:
  create, read, update, and delete. Shared authentication and database lifecycle code lives in
  `__tests__/integration/utils` so route tests do not duplicate bootstrap or cleanup behavior.
- `__tests__/integration/notification.test.ts` covers service transactions, participant isolation,
  unread state, targeting, and device registration with the same scoped database fixtures.
- `tests/e2e/notification.spec.ts` covers the account unread badge, permission warning, responsive
  messenger geometry, incoming and outgoing direct messages, read state, and announcement scheduling
  on the desktop and mobile Playwright projects. Notification seeding, authentication, and cleanup are
  shared through `tests/e2e/utils/notification.ts` and `tests/e2e/utils/bun-fixtures.ts`.
