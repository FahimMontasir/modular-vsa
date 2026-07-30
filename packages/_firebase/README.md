# Firebase

Lazy web adapters for Analytics/FCM and server adapters for Firebase Admin Messaging 14.

- `web/init` initializes the browser app once.
- `web/analytics` and `web/telemetry` emit normalized, anonymous events only.
- `web/messaging` manages permission, Firebase Installation ID (FID) registration, and foreground
  messages.
- `server/init` loads Admin credentials at runtime; `server/messaging` targets FIDs or topics.

All public `VITE_FIREBASE_*` values, including `VITE_FIREBASE_VAPID_KEY`, are required in the portal
environment. Enable the Firebase Cloud Messaging API for the same project. FCM web push requires
HTTPS outside localhost and a browser with the Push, Notification, and service-worker APIs.

Admin credentials are resolved at runtime in this order: explicit `FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`; `FIREBASE_SERVICE_ACCOUNT_PATH`; then Google
Application Default Credentials. Local development also recognizes the ignored
`packages/_firebase/service-key.json`. Credential JSON is read with filesystem I/O and must never be
imported, bundled, committed, logged, or copied into a deployment artifact.

The notification service worker is configured in `apps/portal/src/sw.ts`. The server sends data-only
messages so the foreground page and background service worker each render exactly one popup. Never
log message bodies, FIDs, user identifiers, or Firebase credentials.

Firebase acceptance means FCM accepted the request; it is not a delivery or read receipt. Durable delivery state belongs to `@modular-vsa/notification`.
