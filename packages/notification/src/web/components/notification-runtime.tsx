import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { reconcileNotificationQueries, startFirebaseNotificationRuntime } from "../firebase";

export function NotificationRuntime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let active = true;
    void startFirebaseNotificationRuntime(queryClient).then((stop) => {
      if (active) unsubscribe = stop;
      else stop();
    });
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
      active = false;
      unsubscribe?.();
      window.removeEventListener("focus", reconcile);
      window.removeEventListener("online", reconcile);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [queryClient]);

  return null;
}
