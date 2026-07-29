/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";

import { initializeBackgroundMessaging } from "@modular-vsa/firebase/web/messaging-sw";

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<unknown> };

precacheAndRoute(self.__WB_MANIFEST);
void initializeBackgroundMessaging();
