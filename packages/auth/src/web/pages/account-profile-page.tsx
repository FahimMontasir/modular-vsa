import { useLingui } from "@lingui/react/macro";
import { UserRoundIcon } from "lucide-react";
import { useState, type FormEvent } from "react";

import { trackEvent } from "@modular-vsa/firebase/web/telemetry";
import { PageContainer } from "@modular-vsa/shared/web/components/page-container";
import { SectionHeader } from "@modular-vsa/shared/web/components/section-header";
import { Button } from "@modular-vsa/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@modular-vsa/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@modular-vsa/ui/field";
import { Input } from "@modular-vsa/ui/input";
import { toast } from "@modular-vsa/ui/sonner";
import { Spinner } from "@modular-vsa/ui/spinner";

import { authClient } from "../client";
import { useAuth } from "../provider";
import { getFormString } from "./shared";

export function AccountProfilePage() {
  const { t } = useLingui();
  const auth = useAuth();
  const user = auth.session!.user;
  const [usernameStatus, setUsernameStatus] = useState<string>();
  const [pending, setPending] = useState(false);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setPending(true);
    try {
      await authClient.updateUser({
        name: getFormString(values, "name").trim(),
        username: getFormString(values, "username").trim(),
      });
      await auth.refresh();
      await trackEvent("account_action", { action: "profile_update", outcome: "success" });
      toast.success(t`Profile updated`);
    } catch {
      void trackEvent("account_action", { action: "profile_update", outcome: "failed" });
      toast.error(t`Profile could not be updated`);
    } finally {
      setPending(false);
    }
  }

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
            key={`${user.id}:${user.name}:${user.displayUsername ?? user.username ?? ""}`}
            onSubmit={updateProfile}
          >
            <FieldGroup className="max-w-xl">
              <Field>
                <FieldLabel htmlFor="profile-name">{t`Name`}</FieldLabel>
                <Input id="profile-name" name="name" defaultValue={user.name} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="profile-username">{t`Username`}</FieldLabel>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="profile-username"
                    name="username"
                    defaultValue={user.displayUsername ?? user.username ?? ""}
                    minLength={3}
                    maxLength={30}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(event) => {
                      const input = event.currentTarget.form?.elements.namedItem(
                        "username"
                      ) as HTMLInputElement | null;
                      if (input) void checkUsername(input.value.trim());
                    }}
                  >
                    {t`Check availability`}
                  </Button>
                </div>
                {usernameStatus && <FieldDescription>{usernameStatus}</FieldDescription>}
              </Field>
              <Field>
                <Button type="submit" disabled={pending}>
                  {pending ? <Spinner data-icon="inline-start" /> : null}
                  {t`Save profile`}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
