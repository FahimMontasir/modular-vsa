import { useLocation, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { authClient } from "@modular-vsa/auth/web/client";
import { useAuth } from "@modular-vsa/auth/web/provider";
import { trackEvent } from "@modular-vsa/firebase/web/telemetry";
import { MessengerModal } from "@modular-vsa/notification/components/messenger-modal";
import { NotificationRuntime } from "@modular-vsa/notification/components/notification-runtime";
import { useUnreadQuery } from "@modular-vsa/notification/web/api/query";
import { detachCurrentDevice } from "@modular-vsa/notification/web/firebase";
import { ApplicationShell } from "@modular-vsa/shared/web/components/application-shell";

export function PortalShell() {
  const auth = useAuth();
  const location = useLocation();
  const router = useRouter();
  const [messengerOpen, setMessengerOpen] = useState(false);
  const [initialConversationId, setInitialConversationId] = useState<string>();
  const unreadQuery = useUnreadQuery();
  const session = auth.session;

  useEffect(() => {
    const conversationId = new URLSearchParams(window.location.search).get("messenger");
    if (conversationId) {
      setInitialConversationId(conversationId);
      setMessengerOpen(true);
    }
  }, []);

  async function signOut() {
    await detachCurrentDevice().catch(() => undefined);
    await authClient.signOut();
    await trackEvent("auth_action", { action: "sign_out", outcome: "success" });
    await auth.refresh();
    await router.invalidate();
    await router.navigate({ to: "/login", search: { redirect: "/" } });
  }

  async function stopImpersonating() {
    await authClient.admin.stopImpersonating();
    window.location.assign(location.pathname);
  }

  if (!session) return null;

  return (
    <>
      <ApplicationShell
        user={session.user}
        isImpersonating={Boolean(session.session.impersonatedBy)}
        onSignOut={signOut}
        onStopImpersonating={stopImpersonating}
        unreadCount={unreadQuery.data?.count ?? 0}
        onOpenMessenger={() => setMessengerOpen(true)}
      />
      <MessengerModal
        open={messengerOpen}
        onOpenChange={setMessengerOpen}
        currentUserId={session.user.id}
        isAdmin={session.user.role?.split(",").includes("admin") ?? false}
        initialConversationId={initialConversationId}
      />
      <NotificationRuntime />
    </>
  );
}
