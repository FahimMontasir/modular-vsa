import { useLingui } from "@lingui/react/macro";
import {
  BanIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@modular-vsa/env/auth-policy";
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@modular-vsa/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@modular-vsa/ui/field";
import { Input } from "@modular-vsa/ui/input";
import { NativeSelect, NativeSelectOption } from "@modular-vsa/ui/native-select";
import { Spinner } from "@modular-vsa/ui/spinner";
import { toast } from "@modular-vsa/ui/toast";

import { roleNames, type RoleName } from "../../access-control";
import { authClient } from "../client";
import { useAuth } from "../provider";
import { getFormString } from "./shared";

type UsersResponse = Awaited<ReturnType<typeof authClient.admin.listUsers>>;
type ManagedUser = UsersResponse["users"][number] & {
  username?: string | null;
  displayUsername?: string | null;
};

export function AccessUsersPage() {
  const { t } = useLingui();
  const auth = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const canMutate = auth.hasPermission({ user: ["update"] });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authClient.admin.listUsers({
        query: {
          limit: 50,
          offset: 0,
          searchValue: search || undefined,
          searchField: "name",
          searchOperator: "contains",
        },
      });
      setUsers(response.users as ManagedUser[]);
      setTotal(response.total);
      setSelectedId((current) =>
        current && response.users.some((user) => user.id === current)
          ? current
          : response.users[0]?.id
      );
    } catch {
      toast.error(t`The user directory could not be loaded`);
    } finally {
      setLoading(false);
    }
  }, [search, t]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadUsers(), 200);
    return () => window.clearTimeout(timeout);
  }, [loadUsers]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    void authClient.admin
      .getUser({ query: { id: selectedId } })
      .then((user) => {
        if (!active) return;
        setUsers((current) =>
          current.map((item) => (item.id === user.id ? { ...item, ...user } : item))
        );
      })
      .catch(() => toast.error(t`The selected identity could not be loaded`));
    return () => {
      active = false;
    };
  }, [selectedId, t]);

  async function runAction(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      toast.success(message);
      await loadUsers();
    } catch {
      toast.error(t`The administrator action could not be completed`);
    }
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    await runAction(
      () =>
        authClient.admin.createUser({
          name: getFormString(values, "name").trim(),
          email: getFormString(values, "email").trim(),
          password: getFormString(values, "password"),
          role: (getFormString(values, "role") || "director") as RoleName,
          data: {
            username: getFormString(values, "username").trim(),
            displayUsername: getFormString(values, "username").trim(),
          },
        }),
      t`User created`
    );
    form.reset();
  }

  const selectedUser = users.find((user) => user.id === selectedId);

  return (
    <PageContainer>
      <SectionHeader
        kind="access-control"
        eyebrow={t`Administration`}
        title={t`Access Control`}
        description={t`Provision identities, inspect access, and apply the shared Better Auth role policy.`}
        badge={canMutate ? t`Administrator mode` : t`Director · read only`}
      />

      {canMutate && <CreateUserCard onSubmit={createUser} />}

      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle>{t`User directory`}</CardTitle>
              <CardDescription>{t`${total} identities`}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Field className="min-w-0 sm:w-72">
                <FieldLabel className="sr-only" htmlFor="user-search">
                  {t`Search users`}
                </FieldLabel>
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="user-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t`Search names`}
                    className="pl-8"
                  />
                </div>
              </Field>
              <Button
                variant="outline"
                size="icon"
                onClick={() => void loadUsers()}
                disabled={loading}
              >
                {loading ? <Spinner /> : <RefreshCwIcon />}
                <span className="sr-only">{t`Refresh users`}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => (
            <button
              type="button"
              key={user.id}
              onClick={() => setSelectedId(user.id)}
              className="flex min-w-0 flex-col gap-3 rounded-lg border p-4 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant={user.banned ? "destructive" : "secondary"}>
                  {user.banned ? t`Banned` : user.role === "admin" ? t`Administrator` : t`Director`}
                </Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                @{user.displayUsername ?? user.username ?? t`not set`}
              </p>
            </button>
          ))}
          {!loading && users.length === 0 && (
            <Empty className="md:col-span-2 xl:col-span-3">
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>{t`No users found`}</EmptyTitle>
                <EmptyDescription>{t`Change the search or create a managed user.`}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <ManagedUserCard
          key={selectedUser.id}
          user={selectedUser}
          canMutate={canMutate}
          runAction={runAction}
        />
      )}
    </PageContainer>
  );
}

function CreateUserCard({
  onSubmit,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const { t } = useLingui();
  const [pending, setPending] = useState(false);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t`Create a managed user`}</CardTitle>
        <CardDescription>
          {t`Public registration is disabled; administrators provision accounts here.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={async (event) => {
            setPending(true);
            try {
              await onSubmit(event);
            } finally {
              setPending(false);
            }
          }}
        >
          <FieldGroup className="grid sm:grid-cols-2 lg:grid-cols-5">
            <Field>
              <FieldLabel htmlFor="new-name">{t`Name`}</FieldLabel>
              <Input id="new-name" name="name" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-email">{t`Email`}</FieldLabel>
              <Input id="new-email" name="email" type="email" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-username">{t`Username`}</FieldLabel>
              <Input id="new-username" name="username" minLength={3} maxLength={30} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-password">{t`Password`}</FieldLabel>
              <Input
                id="new-password"
                name="password"
                type="password"
                minLength={PASSWORD_MIN_LENGTH}
                maxLength={PASSWORD_MAX_LENGTH}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-role">{t`Role`}</FieldLabel>
              <NativeSelect id="new-role" name="role" defaultValue="director" className="w-full">
                {roleNames.map((role) => (
                  <NativeSelectOption key={role} value={role}>
                    {role === "admin" ? t`Administrator` : t`Director`}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field className="sm:col-span-2 lg:col-span-5">
              <Button type="submit" disabled={pending}>
                {pending ? <Spinner data-icon="inline-start" /> : null}
                {t`Create user`}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

function ManagedUserCard({
  user,
  canMutate,
  runAction,
}: {
  user: ManagedUser;
  canMutate: boolean;
  runAction: (action: () => Promise<unknown>, message: string) => Promise<void>;
}) {
  const { i18n, t } = useLingui();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleName>((user.role as RoleName) ?? "director");

  async function impersonate() {
    try {
      await authClient.admin.impersonateUser({ userId: user.id });
      window.location.assign("/");
    } catch {
      toast.error(t`Impersonation could not be started`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t`Selected identity`}</CardTitle>
        <CardDescription>
          {user.email} · {user.id}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{t`Role`}</p>
            <p className="font-medium">{user.role === "admin" ? t`Administrator` : t`Director`}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{t`Username`}</p>
            <p className="font-medium">@{user.displayUsername ?? user.username ?? t`not set`}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{t`Created`}</p>
            <p className="font-medium">{new Date(user.createdAt).toLocaleString(i18n.locale)}</p>
          </div>
        </div>
        {canMutate && (
          <>
            <FieldGroup className="grid md:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="managed-name">{t`Name`}</FieldLabel>
                <Input
                  key={user.name}
                  ref={nameInputRef}
                  id="managed-name"
                  defaultValue={user.name}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="managed-role">{t`Role`}</FieldLabel>
                <NativeSelect
                  id="managed-role"
                  value={role}
                  onChange={(event) => setRole(event.target.value as RoleName)}
                  className="w-full"
                >
                  {roleNames.map((item) => (
                    <NativeSelectOption key={item} value={item}>
                      {item === "admin" ? t`Administrator` : t`Director`}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="managed-password">{t`New password`}</FieldLabel>
                <Input
                  id="managed-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={PASSWORD_MIN_LENGTH}
                  maxLength={PASSWORD_MAX_LENGTH}
                />
              </Field>
            </FieldGroup>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  runAction(
                    () =>
                      authClient.admin.updateUser({
                        userId: user.id,
                        data: { name: nameInputRef.current?.value ?? user.name },
                      }),
                    t`User updated`
                  )
                }
              >
                {t`Save name`}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  runAction(
                    () => authClient.admin.setRole({ userId: user.id, role }),
                    t`Role updated`
                  )
                }
              >
                {t`Set role`}
              </Button>
              <Button
                variant="outline"
                disabled={password.length < PASSWORD_MIN_LENGTH}
                onClick={() =>
                  runAction(
                    () =>
                      authClient.admin.setUserPassword({ userId: user.id, newPassword: password }),
                    t`Password updated`
                  )
                }
              >
                {t`Set password`}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  runAction(
                    () =>
                      user.banned
                        ? authClient.admin.unbanUser({ userId: user.id })
                        : authClient.admin.banUser({
                            userId: user.id,
                            banReason: t`Restricted by administrator`,
                          }),
                    user.banned ? t`User unbanned` : t`User banned`
                  )
                }
              >
                {user.banned ? (
                  <ShieldCheckIcon data-icon="inline-start" />
                ) : (
                  <BanIcon data-icon="inline-start" />
                )}
                {user.banned ? t`Unban` : t`Ban`}
              </Button>
              <Button variant="outline" onClick={() => void impersonate()}>
                {t`Impersonate`}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" />}>
                  <Trash2Icon data-icon="inline-start" />
                  {t`Remove user`}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t`Remove ${user.name}?`}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t`This permanently deletes the user, accounts, and sessions. It cannot be undone.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t`Cancel`}</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() =>
                        runAction(
                          () => authClient.admin.removeUser({ userId: user.id }),
                          t`User removed`
                        )
                      }
                    >
                      {t`Remove permanently`}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
