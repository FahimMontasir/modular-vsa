# Firebase

Lazy web adapters for Analytics/FCM and server adapters for Firebase Admin Messaging.

- `web/init` initializes the browser app once.
- `web/analytics` and `web/telemetry` emit normalized, anonymous events only.
- `web/messaging` manages permission, installation registration, tokens, and foreground messages.
- `server/init` loads Admin credentials; `server/messaging` sends batched device or topic messages.

Public `VITE_FIREBASE_*` values and the VAPID key live in `apps/portal/.env.local`. Local Admin credentials use the ignored `packages/_firebase/service-key.json`; production may use explicit environment credentials or Google Application Default Credentials.

The notification service worker is configured in `apps/portal/src/sw.ts`. Use HTTPS outside localhost. Never log message bodies, tokens, installation IDs, or user identifiers in analytics.

Firebase acceptance means FCM accepted the request; it is not a delivery or read receipt. Durable delivery state belongs to `@modular-vsa/notification`.
