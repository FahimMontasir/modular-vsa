import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

import "@modular-vsa/ui/globals.css";

import { AuthProvider, useAuth } from "@modular-vsa/auth/web/provider";
import { initializeI18n } from "@modular-vsa/i18n/i18n";

import { QueryClientProvider } from "./providers/query-provider";
import { router } from "./router";

function AppRouter() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

import { registerSW } from "virtual:pwa-register";

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Root element not found");
}

// eslint-disable-next-line no-console
console.info("[PWA] Registering service worker...");
registerSW({
  immediate: true,
  onNeedRefresh() {
    // eslint-disable-next-line no-console
    console.info("[PWA] New content available, please refresh.");
  },
  onOfflineReady() {
    // eslint-disable-next-line no-console
    console.info("[PWA] App ready to work offline.");
  },
  onRegistered(r) {
    // eslint-disable-next-line no-console
    console.info("[PWA] Service Worker registered", r);
  },
  onRegisterError(error) {
    // eslint-disable-next-line no-console
    console.error("[PWA] Service Worker registration failed", error);
  },
});

await initializeI18n();

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <I18nProvider i18n={i18n}>
      <QueryClientProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}
