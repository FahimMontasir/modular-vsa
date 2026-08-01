import { useLingui } from "@lingui/react/macro";
import { KeyRoundIcon } from "lucide-react";
import { useState } from "react";

import { trackEvent } from "@modular-vsa/firebase/web/telemetry";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@modular-vsa/ui/card";
import { Field, FieldGroup } from "@modular-vsa/ui/field";
import { useAppForm } from "@modular-vsa/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@modular-vsa/ui/tabs";

import { authClient } from "../client";
import { useAuth } from "../provider";
export function LoginPage({ redirectTo }: { redirectTo: string }) {
  const { t } = useLingui();
  const auth = useAuth();
  const [method, setMethod] = useState<"username" | "email">("username");
  const [error, setError] = useState<string>();
  const form = useAppForm({
    defaultValues: { identifier: "", password: "" },
    onSubmit: async ({ value }) => {
      setError(undefined);
      const identifier = value.identifier.trim();
      try {
        if (method === "username")
          await authClient.signIn.username({ username: identifier, password: value.password });
        else await authClient.signIn.email({ email: identifier, password: value.password });
        await trackEvent("auth_action", { action: "sign_in", method, outcome: "success" });
        await auth.refresh();
        window.location.assign(redirectTo);
      } catch {
        void trackEvent("auth_action", { action: "sign_in", method, outcome: "failed" });
        setError(t`The credentials did not match an active account.`);
      }
    },
  });

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <KeyRoundIcon />
          </div>
          Modular VSA
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{t`Welcome back`}</CardTitle>
            <CardDescription>{t`Sign in to the control plane`}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={method}
              onValueChange={(value) => {
                setMethod(value as typeof method);
                setError(undefined);
              }}
            >
              <TabsList className="mb-5 grid w-full grid-cols-2">
                <TabsTrigger value="username">{t`Username`}</TabsTrigger>
                <TabsTrigger value="email">{t`Email`}</TabsTrigger>
              </TabsList>
              <TabsContent value={method}>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void form.handleSubmit();
                  }}
                >
                  <form.AppForm>
                    <FieldGroup>
                      <form.AppField
                        name="identifier"
                        validators={{
                          onBlur: ({ value }) =>
                            value.trim() ? undefined : t`Enter your sign-in identifier.`,
                        }}
                      >
                        {(field) => (
                          <field.TextField
                            id="identifier"
                            label={method === "username" ? t`Username` : t`Email`}
                            type={method === "email" ? "email" : "text"}
                            autoComplete={method === "email" ? "email" : "username"}
                            placeholder={method === "email" ? t`you@example.com` : t`your.username`}
                            error={error}
                            required
                          />
                        )}
                      </form.AppField>
                      <form.AppField
                        name="password"
                        validators={{
                          onBlur: ({ value }) => (value ? undefined : t`Enter your password.`),
                        }}
                      >
                        {(field) => (
                          <field.TextField
                            id="password"
                            label={t`Password`}
                            type="password"
                            autoComplete="current-password"
                            error={error}
                            required
                          />
                        )}
                      </form.AppField>
                      <Field>
                        <form.SubmitButton>{t`Sign in`}</form.SubmitButton>
                      </Field>
                    </FieldGroup>
                  </form.AppForm>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <p className="px-6 text-center text-xs text-muted-foreground">
          {t`Accounts are provisioned by an administrator. Public registration is disabled.`}
        </p>
      </div>
    </main>
  );
}
