import { useLingui } from "@lingui/react/macro";
import { UserRoundIcon } from "lucide-react";
import { useState } from "react";

import { trackEvent } from "@modular-vsa/firebase/web/telemetry";
import { PageContainer } from "@modular-vsa/shared/web/components/page-container";
import { SectionHeader } from "@modular-vsa/shared/web/components/section-header";
import { Button } from "@modular-vsa/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@modular-vsa/ui/card";
import { Field, FieldDescription, FieldGroup } from "@modular-vsa/ui/field";
import { useAppForm } from "@modular-vsa/ui/form";
import { toast } from "@modular-vsa/ui/toast";

import { authClient } from "../client";
import { useAuth } from "../provider";
export function AccountProfilePage() {
  const { t } = useLingui();
  const auth = useAuth();
  const user = auth.session!.user;
  const [usernameStatus, setUsernameStatus] = useState<string>();
  const form = useAppForm({
    defaultValues: {
      name: user.name,
      username: user.displayUsername ?? user.username ?? "",
    },
    onSubmit: async ({ value }) => {
      try {
        const next = { name: value.name.trim(), username: value.username.trim() };
        await authClient.updateUser(next);
        await auth.refresh();
        form.reset(next);
        await trackEvent("account_action", { action: "profile_update", outcome: "success" });
        toast.success(t`Profile updated`);
      } catch {
        void trackEvent("account_action", { action: "profile_update", outcome: "failed" });
        toast.error(t`Profile could not be updated`);
      }
    },
  });

  async function checkUsername(username: string) {
    if (username === user.username || username === user.displayUsername) {
      setUsernameStatus(t`This is your current username.`);
      return;
    }
    try {
      const response = await authClient.isUsernameAvailable({ username });
      setUsernameStatus(response.available ? t`Username is available.` : t`Username is taken.`);
    } catch {
      setUsernameStatus(t`Username availability could not be checked.`);
    }
  }

  return (
    <PageContainer>
      <SectionHeader
        kind="account"
        eyebrow={t`Account`}
        title={t`Your identity`}
        description={t`Manage profile details and sign-in identifiers for this account.`}
        badge={user.role === "admin" ? t`Administrator` : t`Director`}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRoundIcon />
            {t`Profile`}
          </CardTitle>
          <CardDescription>{t`Your public name and normalized sign-in username.`}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <form.AppForm>
              <FieldGroup className="max-w-xl">
                <form.AppField
                  name="name"
                  validators={{
                    onBlur: ({ value }) => (value.trim() ? undefined : t`Enter your name.`),
                  }}
                >
                  {(field) => <field.TextField id="profile-name" label={t`Name`} required />}
                </form.AppField>
                <form.AppField
                  name="username"
                  validators={{
                    onBlur: ({ value }) =>
                      value.trim().length >= 3 ? undefined : t`Use at least 3 characters.`,
                  }}
                >
                  {(field) => (
                    <field.TextField
                      id="profile-username"
                      label={t`Username`}
                      minLength={3}
                      maxLength={30}
                      required
                    />
                  )}
                </form.AppField>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void checkUsername(form.getFieldValue("username").trim())}
                  >
                    {t`Check availability`}
                  </Button>
                  {usernameStatus ? (
                    <FieldDescription className="self-center">{usernameStatus}</FieldDescription>
                  ) : null}
                </div>
                <Field>
                  <form.SubmitButton>{t`Save profile`}</form.SubmitButton>
                </Field>
              </FieldGroup>
            </form.AppForm>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
