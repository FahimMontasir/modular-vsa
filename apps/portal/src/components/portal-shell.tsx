import { useLocation, useRouter } from "@tanstack/react-router";

import { authClient } from "@modular-vsa/auth/web/client";
import { useAuth } from "@modular-vsa/auth/web/provider";
import { ApplicationShell } from "@modular-vsa/shared/web/components/application-shell";

export function PortalShell() {
  const auth = useAuth();
  const location = useLocation();
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    await auth.refresh();
    await router.invalidate();
    await router.navigate({ to: "/login", search: { redirect: "/" } });
  }

  async function stopImpersonating() {
    await authClient.admin.stopImpersonating();
    window.location.assign(location.pathname);
  }

  return (
    <ApplicationShell
      user={auth.session!.user}
      isImpersonating={Boolean(auth.session?.session.impersonatedBy)}
      onSignOut={signOut}
      onStopImpersonating={stopImpersonating}
    />
  );
}
