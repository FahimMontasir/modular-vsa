import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import {
  enableNotifications,
  listenForFirebaseMessages,
  reconcileNotificationQueries,
} from "../firebase";

export function NotificationRuntime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if ("Notification" in window && Notification.permission === "granted") {
      void enableNotifications();
      import("@modular-vsa/firebase/web/messaging").then(({ isMessagingSupported }) =>
        isMessagingSupported().then((supported) => {
          if (supported) unsubscribe = listenForFirebaseMessages(queryClient);
        })
      );
    }
    function reconcile() {
      void reconcileNotificationQueries(queryClient);
    }
    function visible() {
      if (document.visibilityState === "visible") reconcile();
    }
    window.addEventListener("focus", reconcile);
    window.addEventListener("online", reconcile);
    document.addEventListener("visibilitychange", visible);
    return () => {
      unsubscribe?.();
      window.removeEventListener("focus", reconcile);
      window.removeEventListener("online", reconcile);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [queryClient]);

  return null;
}
