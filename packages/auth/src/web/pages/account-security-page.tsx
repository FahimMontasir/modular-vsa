import { useLingui } from "@lingui/react/macro";
import { KeyRoundIcon, MailIcon, Trash2Icon } from "lucide-react";

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
import { Field, FieldGroup } from "@modular-vsa/ui/field";
import { useAppForm } from "@modular-vsa/ui/form";
import { toast } from "@modular-vsa/ui/toast";

import { authClient } from "../client";
import { useAuth } from "../provider";
export function AccountSecurityPage() {
  const { t } = useLingui();
  const auth = useAuth();
  const passwordForm = useAppForm({
    defaultValues: { currentPassword: "", newPassword: "" },
    onSubmit: async ({ value }) => {
      try {
        await authClient.changePassword({ ...value, revokeOtherSessions: true });
        passwordForm.reset();
        await auth.refresh();
        await trackEvent("security_action", { action: "password_change", outcome: "success" });
        toast.success(t`Password changed and other sessions revoked`);
      } catch {
        void trackEvent("security_action", { action: "password_change", outcome: "failed" });
        toast.error(t`Password could not be changed`);
      }
    },
  });
  const emailForm = useAppForm({
    defaultValues: { newEmail: "" },
    onSubmit: async ({ value }) => {
      try {
        await authClient.changeEmail({
          newEmail: value.newEmail.trim(),
          callbackURL: "/account/security",
        });
        emailForm.reset();
        await auth.refresh();
        await trackEvent("security_action", { action: "email_change", outcome: "success" });
        toast.success(t`Email address updated`);
      } catch {
        void trackEvent("security_action", { action: "email_change", outcome: "failed" });
        toast.error(t`Email address could not be changed`);
      }
    },
  });

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
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void passwordForm.handleSubmit();
              }}
            >
              <passwordForm.AppForm>
                <FieldGroup>
                  <passwordForm.AppField name="currentPassword">
                    {(field) => (
                      <field.TextField
                        id="current-password"
                        label={t`Current password`}
                        type="password"
                        autoComplete="current-password"
                        required
                      />
                    )}
                  </passwordForm.AppField>
                  <passwordForm.AppField
                    name="newPassword"
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
                        label={t`New password`}
                        type="password"
                        autoComplete="new-password"
                        minLength={PASSWORD_MIN_LENGTH}
                        maxLength={PASSWORD_MAX_LENGTH}
                        required
                      />
                    )}
                  </passwordForm.AppField>
                  <Field>
                    <passwordForm.SubmitButton>{t`Change password`}</passwordForm.SubmitButton>
                  </Field>
                </FieldGroup>
              </passwordForm.AppForm>
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
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void emailForm.handleSubmit();
              }}
            >
              <emailForm.AppForm>
                <FieldGroup>
                  <emailForm.AppField
                    name="newEmail"
                    validators={{
                      onBlur: ({ value }) =>
                        value.includes("@") ? undefined : t`Enter a valid email address.`,
                    }}
                  >
                    {(field) => (
                      <field.TextField
                        id="new-email"
                        label={t`New email`}
                        type="email"
                        autoComplete="email"
                        required
                      />
                    )}
                  </emailForm.AppField>
                  <Field>
                    <emailForm.SubmitButton>{t`Change email`}</emailForm.SubmitButton>
                  </Field>
                </FieldGroup>
              </emailForm.AppForm>
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
      <DeleteAccountCard auth={auth} />
    </PageContainer>
  );
}

function DeleteAccountCard({ auth }: { auth: ReturnType<typeof useAuth> }) {
  const { t } = useLingui();
  const form = useAppForm({
    defaultValues: { password: "" },
    onSubmit: async ({ value }) => {
      try {
        await authClient.deleteUser({ password: value.password });
        await trackEvent("security_action", { action: "account_delete", outcome: "success" });
        await auth.refresh();
        window.location.assign("/login");
      } catch {
        void trackEvent("security_action", { action: "account_delete", outcome: "failed" });
        toast.error(t`Account could not be deleted`);
      }
    },
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t`Delete account`}</CardTitle>
        <CardDescription>
          {t`This action cannot be undone. Enter your current password to continue.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => event.preventDefault()}>
          <form.AppForm>
            <FieldGroup>
              <form.AppField name="password">
                {(field) => (
                  <field.TextField
                    id="delete-password"
                    label={t`Current password`}
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                )}
              </form.AppField>
              <AlertDialog>
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting] as const}
                >
                  {([canSubmit, isSubmitting]) => (
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="destructive"
                          className="self-start"
                          disabled={!canSubmit || isSubmitting || !form.getFieldValue("password")}
                        />
                      }
                    >
                      {t`Delete my account`}
                    </AlertDialogTrigger>
                  )}
                </form.Subscribe>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t`Delete your account permanently?`}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t`All account data and sessions will be removed immediately.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t`Cancel`}</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => void form.handleSubmit()}
                    >
                      {t`Delete permanently`}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </FieldGroup>
          </form.AppForm>
        </form>
      </CardContent>
    </Card>
  );
}
