import { useLingui } from "@lingui/react/macro";
import { KeyRoundIcon, MailIcon, Trash2Icon } from "lucide-react";
import { useState, type FormEvent } from "react";

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@modular-vsa/env/auth-policy";
import { trackEvent } from "@modular-vsa/firebase/web/telemetry";
import { PageContainer } from "@modular-vsa/shared/web/components/page-container";
import { SectionHeader } from "@modular-vsa/shared/web/components/section-header";
import { Alert, AlertDescription, AlertTitle } from "@modular-vsa/ui/alert";
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
import { Field, FieldGroup, FieldLabel } from "@modular-vsa/ui/field";
import { Input } from "@modular-vsa/ui/input";
import { toast } from "@modular-vsa/ui/sonner";
import { Spinner } from "@modular-vsa/ui/spinner";

import { authClient } from "../client";
import { useAuth } from "../provider";
import { getFormString } from "./shared";

export function AccountSecurityPage() {
  const { t } = useLingui();
  const auth = useAuth();
  const [pending, setPending] = useState<"password" | "email" | "delete">();

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setPending("password");
    try {
      await authClient.changePassword({
        currentPassword: getFormString(values, "currentPassword"),
        newPassword: getFormString(values, "newPassword"),
        revokeOtherSessions: true,
      });
      form.reset();
      await auth.refresh();
      await trackEvent("security_action", { action: "password_change", outcome: "success" });
      toast.success(t`Password changed and other sessions revoked`);
    } catch {
      void trackEvent("security_action", { action: "password_change", outcome: "failed" });
      toast.error(t`Password could not be changed`);
    } finally {
      setPending(undefined);
    }
  }

  async function changeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setPending("email");
    try {
      await authClient.changeEmail({
        newEmail: getFormString(values, "newEmail").trim(),
        callbackURL: "/account/security",
      });
      await auth.refresh();
      await trackEvent("security_action", { action: "email_change", outcome: "success" });
      toast.success(t`Email address updated`);
    } catch {
      void trackEvent("security_action", { action: "email_change", outcome: "failed" });
      toast.error(t`Email address could not be changed`);
    } finally {
      setPending(undefined);
    }
  }

  async function deleteAccount(password: string) {
    setPending("delete");
    try {
      await authClient.deleteUser({ password });
      await trackEvent("security_action", { action: "account_delete", outcome: "success" });
      await auth.refresh();
      window.location.assign("/login");
    } catch {
      void trackEvent("security_action", { action: "account_delete", outcome: "failed" });
      toast.error(t`Account could not be deleted`);
      setPending(undefined);
    }
  }

  return (
    <PageContainer>
      <SectionHeader
        kind="account"
        eyebrow={t`Account`}
        title={t`Security`}
        description={t`Change credentials and control destructive account operations.`}
        badge={auth.session?.user.emailVerified ? t`Email verified` : t`Email unverified`}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRoundIcon />
              {t`Password`}
            </CardTitle>
            <CardDescription>{t`Changing it revokes every other active session.`}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePassword}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="current-password">{t`Current password`}</FieldLabel>
                  <Input
                    id="current-password"
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="new-password">{t`New password`}</FieldLabel>
                  <Input
                    id="new-password"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    required
                  />
                </Field>
                <Field>
                  <Button type="submit" disabled={Boolean(pending)}>
                    {pending === "password" ? <Spinner data-icon="inline-start" /> : null}
                    {t`Change password`}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MailIcon />
              {t`Email address`}
            </CardTitle>
            <CardDescription>{t`Current address: ${auth.session?.user.email}`}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={changeEmail}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="new-email">{t`New email`}</FieldLabel>
                  <Input
                    id="new-email"
                    name="newEmail"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </Field>
                <Field>
                  <Button type="submit" disabled={Boolean(pending)}>
                    {pending === "email" ? <Spinner data-icon="inline-start" /> : null}
                    {t`Change email`}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
      <Alert variant="destructive">
        <Trash2Icon />
        <AlertTitle>{t`Danger zone`}</AlertTitle>
        <AlertDescription>
          {t`Self-service deletion permanently removes your identity, credentials, and sessions.`}
        </AlertDescription>
      </Alert>
      <DeleteAccountCard pending={pending === "delete"} onDelete={deleteAccount} />
    </PageContainer>
  );
}

function DeleteAccountCard({
  pending,
  onDelete,
}: {
  pending: boolean;
  onDelete: (password: string) => Promise<void>;
}) {
  const { t } = useLingui();
  const [password, setPassword] = useState("");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t`Delete account`}</CardTitle>
        <CardDescription>
          {t`This action cannot be undone. Enter your current password to continue.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field className="max-w-md">
          <FieldLabel htmlFor="delete-password">{t`Current password`}</FieldLabel>
          <Input
            id="delete-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="destructive"
                className="self-start"
                disabled={!password || pending}
              />
            }
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {t`Delete my account`}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t`Delete your account permanently?`}</AlertDialogTitle>
              <AlertDialogDescription>
                {t`All account data and sessions will be removed immediately.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t`Cancel`}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => void onDelete(password)}>
                {t`Delete permanently`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
