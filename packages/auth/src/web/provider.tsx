import { useLingui } from "@lingui/react/macro";
import { createContext, useContext, useMemo, type PropsWithChildren } from "react";

import { Spinner } from "@modular-vsa/ui/spinner";

import { roleHasPermission, type AccessControlPermissions } from "../access-control";
import { authClient } from "./client";

export type AuthSession = typeof authClient.$Infer.Session;

export type AuthContextValue = {
  session: AuthSession | null;
  refresh: () => Promise<void>;
  hasPermission: (permissions: AccessControlPermissions) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const { t } = useLingui();
  const sessionQuery = authClient.useSession();
  const { data: session, refetch } = sessionQuery;
  const value = useMemo<AuthContextValue>(
    () => ({
      session: session ?? null,
      async refresh() {
        await refetch();
      },
      hasPermission(permissions) {
        return roleHasPermission(session?.user.role ?? "director", permissions);
      },
    }),
    [refetch, session]
  );

  if (sessionQuery.isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Spinner className="size-6" />
        <span className="sr-only">{t`Loading session`}</span>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
