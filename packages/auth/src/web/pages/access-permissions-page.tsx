import { useLingui } from "@lingui/react/macro";
import { useState } from "react";

import { PageContainer } from "@modular-vsa/shared/web/components/page-container";
import { SectionHeader } from "@modular-vsa/shared/web/components/section-header";
import { Badge } from "@modular-vsa/ui/badge";
import { Button } from "@modular-vsa/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@modular-vsa/ui/card";
import { Field, FieldLabel } from "@modular-vsa/ui/field";
import { NativeSelect, NativeSelectOption } from "@modular-vsa/ui/native-select";

import {
  accessControlStatement,
  roleNames,
  roles,
  type AccessControlResource,
  type RoleName,
} from "../../access-control";
import { authClient } from "../client";
import { useAuth } from "../provider";

export function AccessPermissionsPage() {
  const { t } = useLingui();
  const auth = useAuth();
  const currentRole = (auth.session?.user.role ?? "director") as RoleName;
  const [role, setRole] = useState<RoleName>(currentRole);
  const [resource, setResource] = useState<AccessControlResource>("user");
  const [action, setAction] = useState<string>(accessControlStatement.user[0]);
  const [remoteResult, setRemoteResult] = useState<string>();
  const labels: Record<string, string> = {
    admin: t`Administrator`,
    director: t`Director`,
    user: t`Users`,
    session: t`Sessions`,
    post: t`Posts`,
    storage: t`Storage`,
    create: t`Create`,
    list: t`List`,
    get: t`View`,
    update: t`Update`,
    delete: t`Delete`,
    "set-role": t`Set role`,
    "set-password": t`Set password`,
    ban: t`Ban`,
    impersonate: t`Impersonate`,
    "impersonate-admins": t`Impersonate administrators`,
    revoke: t`Revoke`,
    read: t`Read`,
    upload: t`Upload`,
  };
  function labelFor(value: string) {
    return labels[value] ?? value;
  }

  function selectResource(next: AccessControlResource) {
    setResource(next);
    setAction(accessControlStatement[next][0]);
    setRemoteResult(undefined);
  }

  const permissions = { [resource]: [action] } as never;
  const localAllowed = authClient.admin.checkRolePermission({ role, permissions });

  return (
    <PageContainer>
      <SectionHeader
        kind="access-control"
        eyebrow={t`Administration`}
        title={t`Access Control`}
        description={t`Review the single policy shared by Better Auth, its client, and protected API routes.`}
        badge={t`Signed in as ${labelFor(currentRole)}`}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>{t`Role permission matrix`}</CardTitle>
            <CardDescription>
              {t`Allowed actions use a filled badge; denied actions use an outline.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {Object.entries(accessControlStatement).map(([resourceName, actions]) => (
              <div
                key={resourceName}
                className="grid gap-3 rounded-lg border p-4 md:grid-cols-[9rem_1fr_1fr]"
              >
                <p className="font-medium">{labelFor(resourceName)}</p>
                {roleNames.map((roleName) => (
                  <div key={roleName} className="flex flex-col gap-2">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {labelFor(roleName)}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {actions.map((permissionAction) => (
                        <Badge
                          key={permissionAction}
                          variant={
                            roles[roleName].authorize({
                              [resourceName]: [permissionAction],
                            } as never).success
                              ? "default"
                              : "outline"
                          }
                        >
                          {labelFor(permissionAction)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{t`Permission check`}</CardTitle>
            <CardDescription>
              {t`Compare synchronous role policy with the authenticated server check.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="permission-role">{t`Role`}</FieldLabel>
              <NativeSelect
                id="permission-role"
                value={role}
                onChange={(event) => setRole(event.target.value as RoleName)}
              >
                {roleNames.map((name) => (
                  <NativeSelectOption key={name} value={name}>
                    {labelFor(name)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="permission-resource">{t`Resource`}</FieldLabel>
              <NativeSelect
                id="permission-resource"
                value={resource}
                onChange={(event) => selectResource(event.target.value as AccessControlResource)}
              >
                {Object.keys(accessControlStatement).map((name) => (
                  <NativeSelectOption key={name} value={name}>
                    {labelFor(name)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="permission-action">{t`Action`}</FieldLabel>
              <NativeSelect
                id="permission-action"
                value={action}
                onChange={(event) => setAction(event.target.value)}
              >
                {accessControlStatement[resource].map((name) => (
                  <NativeSelectOption key={name} value={name}>
                    {labelFor(name)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <p className="text-sm">
              {t`Local policy`}:{" "}
              <Badge variant={localAllowed ? "default" : "outline"}>
                {localAllowed ? t`Allowed` : t`Denied`}
              </Badge>
            </p>
            <Button
              variant="outline"
              onClick={async () => {
                const result = await authClient.admin.hasPermission({ role, permissions });
                setRemoteResult(
                  result.success
                    ? t`Server allowed this permission`
                    : t`Server denied this permission`
                );
              }}
            >
              {t`Check on server`}
            </Button>
            {remoteResult && <p className="text-sm font-medium">{remoteResult}</p>}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
