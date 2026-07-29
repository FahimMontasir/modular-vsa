import { useLingui } from "@lingui/react/macro";
import { KeyRoundIcon } from "lucide-react";
import { useState, type FormEvent } from "react";

import { trackEvent } from "@modular-vsa/firebase/web/telemetry";
import { Button } from "@modular-vsa/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@modular-vsa/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@modular-vsa/ui/field";
import { Input } from "@modular-vsa/ui/input";
import { Spinner } from "@modular-vsa/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@modular-vsa/ui/tabs";

import { authClient } from "../client";
import { useAuth } from "../provider";
import { getFormString } from "./shared";

export function LoginPage({ redirectTo }: { redirectTo: string }) {
  const { t } = useLingui();
  const auth = useAuth();
  const [method, setMethod] = useState<"username" | "email">("username");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    const values = new FormData(event.currentTarget);
    const identifier = getFormString(values, "identifier").trim();
    const password = getFormString(values, "password");

    try {
      if (method === "username")
        await authClient.signIn.username({ username: identifier, password });
      else await authClient.signIn.email({ email: identifier, password });
      await trackEvent("auth_action", { action: "sign_in", method, outcome: "success" });
      await auth.refresh();
      window.location.assign(redirectTo);
    } catch {
      void trackEvent("auth_action", { action: "sign_in", method, outcome: "failed" });
      setError(t`The credentials did not match an active account.`);
    } finally {
      setPending(false);
    }
  }

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
            <Tabs value={method} onValueChange={(value) => setMethod(value as typeof method)}>
              <TabsList className="mb-5 grid w-full grid-cols-2">
                <TabsTrigger value="username">{t`Username`}</TabsTrigger>
                <TabsTrigger value="email">{t`Email`}</TabsTrigger>
              </TabsList>
              <TabsContent value={method}>
                <form onSubmit={submit}>
                  <FieldGroup>
                    <Field data-invalid={Boolean(error)}>
                      <FieldLabel htmlFor="identifier">
                        {method === "username" ? t`Username` : t`Email`}
                      </FieldLabel>
                      <Input
                        id="identifier"
                        name="identifier"
                        type={method === "email" ? "email" : "text"}
                        autoComplete={method === "email" ? "email" : "username"}
                        placeholder={method === "email" ? t`you@example.com` : t`your.username`}
                        aria-invalid={Boolean(error)}
                        required
                      />
                    </Field>
                    <Field data-invalid={Boolean(error)}>
                      <FieldLabel htmlFor="password">{t`Password`}</FieldLabel>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        aria-invalid={Boolean(error)}
                        required
                      />
                      {error && <FieldError>{error}</FieldError>}
                    </Field>
                    <Field>
                      <Button type="submit" disabled={pending}>
                        {pending && <Spinner data-icon="inline-start" />}
                        {t`Sign in`}
                      </Button>
                    </Field>
                  </FieldGroup>
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
