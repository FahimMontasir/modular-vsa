# `@modular-vsa/firebase`

Firebase integration for the Modular VSA monorepo. Provides reusable, documented
utility modules for both **web** (Firebase JS SDK v12) and **server** (Admin SDK v13)
environments.

---

## Setup

### Environment variables

The tracked `apps/portal/.env.local` contains the public Firebase web configuration. These identifiers
are safe to expose in a browser, but Firebase Security Rules must still protect project data.

For a different project, provide the following Vite values:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX     # optional
VITE_FIREBASE_VAPID_KEY=...                    # optional, for FCM
```

For local server development, place the Admin SDK JSON at
`packages/_firebase/service-key.json`. The file is intentionally Git-ignored and should be readable
only by the local user. For production, use these environment values or Google Application Default
Credentials:

```env
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

> **Important:** an Admin SDK service account contains a private key. Never commit it, paste it into
> a public issue, or confuse it with the public Firebase web configuration.

---

## Web modules

Each module is a standalone file importable via sub-path exports:

```ts
import { getApp } from "@modular-vsa/firebase/web/init";
import { logEvent } from "@modular-vsa/firebase/web/analytics";
import { requestFcmToken } from "@modular-vsa/firebase/web/messaging";
import { traceAsync } from "@modular-vsa/firebase/web/performance";
```

### `web/init`

| Export                | Description                                              |
| --------------------- | -------------------------------------------------------- |
| `getApp()`            | Returns the singleton `FirebaseApp` (lazy-init)          |
| `getFirebaseConfig()` | Returns the `FirebaseOptions` object built from env vars |

Reference: https://firebase.google.com/docs/web/setup

### `web/analytics`

| Export                              | Description                                                     |
| ----------------------------------- | --------------------------------------------------------------- |
| `getAnalytics()`                    | Returns `Analytics \| null` (lazy-init, checks `isSupported()`) |
| `logEvent(name, params?, options?)` | Logs an analytics event (no-op if unsupported)                  |

Reference: https://firebase.google.com/docs/analytics

### `web/messaging`

| Export                          | Description                                                       |
| ------------------------------- | ----------------------------------------------------------------- |
| `getMessaging()`                | Returns the `Messaging` instance (lazy-init)                      |
| `requestFcmToken(options?)`     | Registers with FCM and returns the Firebase Installation ID (FID) |
| `onRegistered(callback)`        | Callback invoked when FCM registration completes (receives FID)   |
| `unregisterFcm()`               | Unregisters the app instance from FCM                             |
| `onUnregistered(callback)`      | Callback invoked when FCM registration is deleted                 |
| `onForegroundMessage(callback)` | Listens for messages in the foreground, returns `unsubscribe`     |

> **Note:** Uses the new FID-based `register()` API. The deprecated
> `getToken()` is replaced —
> see https://firebase.google.com/docs/cloud-messaging/js/client#register

Reference: https://firebase.google.com/docs/cloud-messaging

### `web/performance`

| Export                      | Description                                                                |
| --------------------------- | -------------------------------------------------------------------------- |
| `getPerformance(settings?)` | Returns the `FirebasePerformance` instance (lazy-init)                     |
| `trace(name)`               | Creates a custom `PerformanceTrace` (call `.start()` / `.stop()` manually) |
| `traceAsync(name, fn)`      | Wraps an async function with automatic start/stop timing                   |

Reference: https://firebase.google.com/docs/perf-mon

---

## Server modules

```ts
import { getAdminApp } from "@modular-vsa/firebase/server/init";
import { sendPushNotification } from "@modular-vsa/firebase/server/messaging";
```

### `server/init`

| Export          | Description                                                                           |
| --------------- | ------------------------------------------------------------------------------------- |
| `getAdminApp()` | Returns the singleton Firebase Admin `App` (lazy-init, supports key file or env vars) |

Reference: https://firebase.google.com/docs/admin/setup

### `server/messaging`

| Export                                            | Description                                             |
| ------------------------------------------------- | ------------------------------------------------------- |
| `sendPushNotification(message, dryRun?)`          | Sends FCM to a single device, returns message ID        |
| `sendMulticastPushNotification(message, dryRun?)` | Sends FCM to up to 500 devices, returns `BatchResponse` |
| `sendToTopic(message, dryRun?)`                   | Sends FCM to all devices subscribed to a topic          |

Reference: https://firebase.google.com/docs/cloud-messaging/send-message

---

## Usage examples

### Web — log a screen view

```ts
import { logEvent } from "@modular-vsa/firebase/web/analytics";

await logEvent("screen_view", { screen_name: "Home" });
```

### Web — request FCM permission

```ts
import { requestFcmToken, onForegroundMessage } from "@modular-vsa/firebase/web/messaging";

const fid = await requestFcmToken();
console.log("FCM FID:", fid);

const unsubscribe = onForegroundMessage((payload) => {
  console.log("Message received:", payload);
});
```

### Web — observe FCM registration

```ts
import { onRegistered, requestFcmToken } from "@modular-vsa/firebase/web/messaging";

// Callback fires with the FID when registration completes
onRegistered((fid) => {
  console.log("Registered with FID:", fid);
});

await requestFcmToken();
```

### Web — custom performance trace

```ts
import { traceAsync } from "@modular-vsa/firebase/web/performance";

const result = await traceAsync("data-load", () => fetch("/api/data").then((r) => r.json()));
```

### Server — send push notification

```ts
import { sendPushNotification } from "@modular-vsa/firebase/server/messaging";

await sendPushNotification({
  token: "device-fcm-token",
  notification: { title: "Hello", body: "World" },
});
```

### Server — send to topic

```ts
import { sendToTopic } from "@modular-vsa/firebase/server/messaging";

await sendToTopic({
  topic: "news",
  notification: { title: "Breaking", body: "Something happened" },
});
```

## Notification service worker and privacy

The portal uses Vite PWA `injectManifest` with `apps/portal/src/sw.ts`. Firebase messages are data-only
and contain a safe notification type, conversation/message IDs, internal destination, and generic push
copy. The worker displays the notification and opens the selected Messenger conversation. Authoritative
content is fetched from PostgreSQL after the app opens.

Analytics and Performance Monitoring initialize lazily after browser hydration. Analytics parameters
must remain anonymous and content-free: never send user/database/FID identifiers, names, email, search
text, message bodies, posts, announcement bodies, or external URLs.
