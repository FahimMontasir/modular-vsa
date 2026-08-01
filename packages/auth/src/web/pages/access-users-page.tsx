import { useLingui } from "@lingui/react/macro";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { type PaginationState, type SortingState } from "@tanstack/react-table";
import { BanIcon, ShieldCheckIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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
import { Button } from "@modular-vsa/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@modular-vsa/ui/card";
import { Field, FieldGroup } from "@modular-vsa/ui/field";
import { useAppForm } from "@modular-vsa/ui/form";
import { NativeSelectOption } from "@modular-vsa/ui/native-select";
import { toast } from "@modular-vsa/ui/toast";

import { roleNames, type RoleName } from "../../access-control";
import { authClient } from "../client";
import { AccessUserDirectory, type ManagedUser } from "../components/access-user-directory";
import { useAuth } from "../provider";

type CreateUserValues = {
  name: string;
  email: string;
  username: string;
  password: string;
  role: string;
};

export function AccessUsersPage() {
  const { t } = useLingui();
  const auth = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, { wait: 250 });
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [selectedId, setSelectedId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const canMutate = auth.hasPermission({ user: ["update"] });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authClient.admin.listUsers({
        query: {
          limit: pagination.pageSize,
          offset: pagination.pageIndex * pagination.pageSize,
          searchValue: debouncedSearch || undefined,
          searchField: "name",
          searchOperator: "contains",
          sortBy: sorting[0]?.id,
          sortDirection: sorting[0]?.desc ? "desc" : "asc",
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
  }, [debouncedSearch, pagination.pageIndex, pagination.pageSize, sorting, t]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [debouncedSearch]);

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

  async function createUser(values: CreateUserValues) {
    await runAction(
      () =>
        authClient.admin.createUser({
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
          role: (values.role || "director") as RoleName,
          data: {
            username: values.username.trim(),
            displayUsername: values.username.trim(),
          },
        }),
      t`User created`
    );
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

      <AccessUserDirectory
        users={users}
        total={total}
        search={search}
        onSearchChange={setSearch}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        selectedId={selectedId}
        onSelect={setSelectedId}
        loading={loading}
        onRefresh={() => void loadUsers()}
      />

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

function CreateUserCard({ onSubmit }: { onSubmit: (values: CreateUserValues) => Promise<void> }) {
  const { t } = useLingui();
  const form = useAppForm({
    defaultValues: { name: "", email: "", username: "", password: "", role: "director" },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
      form.reset();
    },
  });
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
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.AppForm>
            <FieldGroup className="grid sm:grid-cols-2 lg:grid-cols-5">
              <form.AppField name="name">
                {(field) => <field.TextField id="new-name" label={t`Name`} required />}
              </form.AppField>
              <form.AppField name="email">
                {(field) => (
                  <field.TextField id="new-email" label={t`Email`} type="email" required />
                )}
              </form.AppField>
              <form.AppField
                name="username"
                validators={{
                  onBlur: ({ value }) =>
                    value.length >= 3 ? undefined : t`Use at least 3 characters.`,
                }}
              >
                {(field) => (
                  <field.TextField
                    id="new-username"
                    label={t`Username`}
                    minLength={3}
                    maxLength={30}
                    required
                  />
                )}
              </form.AppField>
              <form.AppField
                name="password"
                validators={{
                  onBlur: ({ value }) =>
                    value.length >= PASSWORD_MIN_LENGTH
                      ? undefined
                      : t`Use at least ${PASSWORD_MIN_LENGTH} characters.`,
                }}
              >
                {(field) => (
                  <field.TextField
                    id="new-password"
                    label={t`Password`}
                    type="password"
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    required
                  />
                )}
              </form.AppField>
              <form.AppField name="role">
                {(field) => (
                  <field.NativeSelectField id="new-role" label={t`Role`} className="w-full">
                    {roleNames.map((role) => (
                      <NativeSelectOption key={role} value={role}>
                        {role === "admin" ? t`Administrator` : t`Director`}
                      </NativeSelectOption>
                    ))}
                  </field.NativeSelectField>
                )}
              </form.AppField>
              <Field className="sm:col-span-2 lg:col-span-5">
                <form.SubmitButton>{t`Create user`}</form.SubmitButton>
              </Field>
            </FieldGroup>
          </form.AppForm>
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
  const form = useAppForm({
    defaultValues: {
      name: user.name,
      role: (user.role as RoleName) ?? "director",
      password: "",
    },
  });

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
          <form onSubmit={(event) => event.preventDefault()}>
            <form.AppForm>
              <FieldGroup className="grid md:grid-cols-3">
                <form.AppField name="name">
                  {(field) => <field.TextField id="managed-name" label={t`Name`} required />}
                </form.AppField>
                <form.AppField name="role">
                  {(field) => (
                    <field.NativeSelectField id="managed-role" label={t`Role`} className="w-full">
                      {roleNames.map((item) => (
                        <NativeSelectOption key={item} value={item}>
                          {item === "admin" ? t`Administrator` : t`Director`}
                        </NativeSelectOption>
                      ))}
                    </field.NativeSelectField>
                  )}
                </form.AppField>
                <form.AppField name="password">
                  {(field) => (
                    <field.TextField
                      id="managed-password"
                      label={t`New password`}
                      type="password"
                      minLength={PASSWORD_MIN_LENGTH}
                      maxLength={PASSWORD_MAX_LENGTH}
                    />
                  )}
                </form.AppField>
              </FieldGroup>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    runAction(
                      () =>
                        authClient.admin.updateUser({
                          userId: user.id,
                          data: { name: form.getFieldValue("name").trim() },
                        }),
                      t`User updated`
                    )
                  }
                >
                  {t`Save name`}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    runAction(
                      () =>
                        authClient.admin.setRole({
                          userId: user.id,
                          role: form.getFieldValue("role"),
                        }),
                      t`Role updated`
                    )
                  }
                >
                  {t`Set role`}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={form.getFieldValue("password").length < PASSWORD_MIN_LENGTH}
                  onClick={async () => {
                    await runAction(
                      () =>
                        authClient.admin.setUserPassword({
                          userId: user.id,
                          newPassword: form.getFieldValue("password"),
                        }),
                      t`Password updated`
                    );
                    form.setFieldValue("password", "");
                  }}
                >
                  {t`Set password`}
                </Button>
                <Button
                  type="button"
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
                <Button type="button" variant="outline" onClick={() => void impersonate()}>
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
            </form.AppForm>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
