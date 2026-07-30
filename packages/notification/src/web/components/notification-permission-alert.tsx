import { useLingui } from "@lingui/react/macro";
import { BellRingIcon, ExternalLinkIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@modular-vsa/ui/alert";
import { Button } from "@modular-vsa/ui/button";
import { Spinner } from "@modular-vsa/ui/spinner";

import {
  enableNotifications,
  notificationPermissionState,
  type PermissionState,
} from "../firebase";

export function NotificationPermissionAlert() {
  const { t } = useLingui();
  const [state, setState] = useState<PermissionState>("default");

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const permission = await notificationPermissionState();
        if (!active) return;
        if (permission === "granted") {
          setState("granted");
          return;
        }
        setState(permission);
      } catch {
        if (active) setState("error");
      }
    }
    void initialize();
    return () => {
      active = false;
    };
  }, []);

  if (state === "granted") return null;

  async function enable() {
    setState("registering");
    try {
      setState(await enableNotifications());
    } catch {
      setState("error");
    }
  }

  const denied = state === "denied";
  const unsupported = state === "unsupported";
  return (
    <Alert variant={denied || state === "error" ? "destructive" : "default"}>
      <BellRingIcon />
      <AlertTitle>{t`Enable notifications to receive messages`}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <span>
          {unsupported
            ? t`This browser cannot receive Firebase notifications. You can still open Messenger to check for updates.`
            : denied
              ? t`Notifications are blocked. Allow them in your browser site settings, then try again.`
              : state === "error"
                ? t`Notification registration failed. Check your connection and try again.`
                : t`Messages, security updates, and announcements arrive through Firebase notifications. Portal access remains available if you decline.`}
        </span>
        {!unsupported ? (
          <Button
            size="sm"
            variant={denied ? "outline" : "default"}
            onClick={() => void enable()}
            disabled={state === "registering"}
          >
            {state === "registering" ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <ExternalLinkIcon data-icon="inline-start" />
            )}
            {state === "registering" ? t`Enabling…` : t`Enable notifications`}
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
