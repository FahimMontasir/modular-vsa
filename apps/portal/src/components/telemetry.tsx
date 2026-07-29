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
