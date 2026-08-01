"use no memo";

import { useLingui } from "@lingui/react/macro";
import { getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { RefreshCwIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import { Button } from "@modular-vsa/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@modular-vsa/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@modular-vsa/ui/empty";
import { Field, FieldLabel } from "@modular-vsa/ui/field";
import { NativeSelect, NativeSelectOption } from "@modular-vsa/ui/native-select";
import { Spinner } from "@modular-vsa/ui/spinner";
import { toast } from "@modular-vsa/ui/toast";

import { authClient } from "../client";
import { DataTable } from "../components/data-table";
import { useAuth } from "../provider";

type UsersResponse = Awaited<ReturnType<typeof authClient.admin.listUsers>>;
type ManagedUser = UsersResponse["users"][number];
type SessionsResponse = Awaited<ReturnType<typeof authClient.admin.listUserSessions>>;
type ManagedSession = SessionsResponse["sessions"][number];

export function AccessSessionsPage() {
  const { i18n, t } = useLingui();
  const auth = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [sessions, setSessions] = useState<ManagedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const sessionsRequestRef = useRef(0);
  const canMutate = auth.hasPermission({ session: ["revoke"] });

  useEffect(() => {
    let active = true;
    void authClient.admin
      .listUsers({ query: { limit: 100, offset: 0 } })
      .then((response) => {
        if (!active) return;
        setUsers(response.users);
        setSelectedId((current) => current || response.users[0]?.id || "");
      })
      .catch(() => toast.error(t`Users could not be loaded`));
    return () => {
      active = false;
    };
  }, [t]);

  const loadSessions = useCallback(async () => {
    const requestId = ++sessionsRequestRef.current;
    if (!selectedId) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await authClient.admin.listUserSessions({ userId: selectedId });
      if (requestId === sessionsRequestRef.current) setSessions(response.sessions);
    } catch {
      if (requestId === sessionsRequestRef.current) toast.error(t`Sessions could not be loaded`);
    } finally {
      if (requestId === sessionsRequestRef.current) setLoading(false);
    }
  }, [selectedId, t]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const selectedUser = users.find((user) => user.id === selectedId);
  const columns = useMemo<Array<ColumnDef<ManagedSession>>>(
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
        id: "actions",
        header: t`Actions`,
        cell: ({ row }) =>
          canMutate ? (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await authClient.admin.revokeUserSession({ sessionToken: row.original.token });
                await loadSessions();
                toast.success(t`Session revoked`);
              }}
            >
              {t`Revoke`}
            </Button>
          ) : null,
      },
    ],
    [canMutate, i18n.locale, loadSessions, t]
  );
  const table = useReactTable({ data: sessions, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <PageContainer>
      <SectionHeader
        kind="access-control"
        eyebrow={t`Administration`}
        title={t`Access Control`}
        description={t`Inspect active sessions by identity and revoke compromised access.`}
        badge={canMutate ? t`Revoke enabled` : t`Read only`}
      />
      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle>{t`User sessions`}</CardTitle>
              <CardDescription>
                {t`Directors can inspect sessions; administrators can revoke them.`}
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
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="session-user">{t`Identity`}</FieldLabel>
            <NativeSelect
              id="session-user"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="w-full sm:max-w-md"
            >
              {users.map((user) => (
                <NativeSelectOption key={user.id} value={user.id}>
                  {user.name} · {user.email}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <DataTable
            table={table}
            empty={
              !loading ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>{t`No active sessions`}</EmptyTitle>
                    <EmptyDescription>{t`This identity has no active browser sessions.`}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : null
            }
          />
          {canMutate && selectedUser && sessions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" className="self-start" />}>
                {t`Revoke all user sessions`}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t`Revoke all sessions?`}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t`${selectedUser.name} will be signed out on every device.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t`Cancel`}</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={async () => {
                      await authClient.admin.revokeUserSessions({ userId: selectedUser.id });
                      await loadSessions();
                      toast.success(t`All user sessions revoked`);
                    }}
                  >
                    {t`Revoke all`}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
