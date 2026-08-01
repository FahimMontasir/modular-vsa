"use no memo";

import { useLingui } from "@lingui/react/macro";
import { getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { LogOutIcon, RefreshCwIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageContainer } from "@modular-vsa/shared/web/components/page-container";
import { SectionHeader } from "@modular-vsa/shared/web/components/section-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@modular-vsa/ui/alert-dialog";
import { Badge } from "@modular-vsa/ui/badge";
import { Button } from "@modular-vsa/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@modular-vsa/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@modular-vsa/ui/empty";
import { Separator } from "@modular-vsa/ui/separator";
import { Spinner } from "@modular-vsa/ui/spinner";
import { toast } from "@modular-vsa/ui/toast";

import { authClient } from "../client";
import { DataTable } from "../components/data-table";
import { useAuth } from "../provider";

type Session = Awaited<ReturnType<typeof authClient.listSessions>>[number];

export function AccountSessionsPage() {
  const { i18n, t } = useLingui();
  const auth = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      setSessions(await authClient.listSessions());
    } catch {
      toast.error(t`Sessions could not be loaded`);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  async function signOut() {
    await authClient.signOut();
    await auth.refresh();
    window.location.assign("/login");
  }

  const columns = useMemo<Array<ColumnDef<Session>>>(
    () => [
      {
        accessorKey: "userAgent",
        header: t`Device`,
        cell: ({ row }) => row.original.userAgent ?? t`Unknown device`,
      },
      {
        accessorKey: "ipAddress",
        header: t`IP address`,
        cell: ({ row }) => row.original.ipAddress ?? t`Unknown IP`,
      },
      {
        accessorKey: "expiresAt",
        header: t`Expires`,
        cell: ({ row }) => new Date(row.original.expiresAt).toLocaleString(i18n.locale),
      },
      {
        id: "status",
        header: t`Status`,
        cell: ({ row }) =>
          row.original.token === auth.session?.session.token ? <Badge>{t`Current`}</Badge> : null,
      },
      {
        id: "actions",
        header: t`Actions`,
        cell: ({ row }) =>
          row.original.token !== auth.session?.session.token ? (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await authClient.revokeSession({ token: row.original.token });
                await loadSessions();
                toast.success(t`Session revoked`);
              }}
            >
              {t`Revoke`}
            </Button>
          ) : null,
      },
    ],
    [auth.session?.session.token, i18n.locale, loadSessions, t]
  );
  const table = useReactTable({ data: sessions, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <PageContainer>
      <SectionHeader
        kind="account"
        eyebrow={t`Account`}
        title={t`Sessions`}
        description={t`Review and revoke browser sessions associated with your account.`}
        badge={t`${sessions.length} active`}
      />
      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle>{t`Active sessions`}</CardTitle>
              <CardDescription>
                {t`The current browser is marked and cannot be revoked individually.`}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadSessions()}
              disabled={loading}
            >
              {loading ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <RefreshCwIcon data-icon="inline-start" />
              )}
              {t`Refresh`}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <DataTable
            table={table}
            empty={
              !loading ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>{t`No sessions found`}</EmptyTitle>
                    <EmptyDescription>{t`No active browser sessions were returned.`}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : null
            }
          />
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                await authClient.revokeOtherSessions();
                await loadSessions();
                toast.success(t`Other sessions revoked`);
              }}
            >
              {t`Revoke other sessions`}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" />}>
                {t`Revoke all and sign out`}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t`Revoke every session?`}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t`Every browser, including this one, will need to sign in again.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t`Cancel`}</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={async () => {
                      await authClient.revokeSessions();
                      await auth.refresh();
                      window.location.assign("/login");
                    }}
                  >
                    {t`Revoke all`}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" onClick={() => void signOut()}>
              <LogOutIcon data-icon="inline-start" />
              {t`Sign out`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
