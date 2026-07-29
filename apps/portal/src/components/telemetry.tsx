import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

export function Telemetry() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    function initialize() {
      void import("@modular-vsa/firebase/web/telemetry").then(({ trackScreen }) =>
        trackScreen(pathname)
      );
      void import("@modular-vsa/firebase/web/performance")
        .then(({ trace }) => {
          const routeTrace = trace(
            `route_${pathname.replaceAll(/[^a-zA-Z0-9]/g, "_").slice(0, 80) || "home"}`
          );
          routeTrace.start();
          requestAnimationFrame(() => routeTrace.stop());
        })
        .catch(() => undefined);
    }
    const requestIdle = window.requestIdleCallback?.bind(window);
    if (requestIdle) {
      const id = requestIdle(initialize);
      return () => window.cancelIdleCallback?.(id);
    }
    const id = globalThis.setTimeout(initialize, 0);
    return () => globalThis.clearTimeout(id);
  }, [location.pathname]);

  return null;
}
