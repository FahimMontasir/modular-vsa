import { useLingui } from "@lingui/react/macro";
import { useState } from "react";

import { PageContainer } from "@modular-vsa/shared/web/components/page-container";
import { SectionHeader } from "@modular-vsa/shared/web/components/section-header";
import { Badge } from "@modular-vsa/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@modular-vsa/ui/card";
import { Field, FieldLabel } from "@modular-vsa/ui/field";
import { useAppForm } from "@modular-vsa/ui/form";
import { NativeSelect, NativeSelectOption } from "@modular-vsa/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@modular-vsa/ui/table";

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

  const form = useAppForm({
    defaultValues: {
      role: currentRole as string,
      resource: "user" as string,
      action: accessControlStatement.user[0] as string,
    },
    onSubmit: async ({ value }) => {
      const permissions = { [value.resource]: [value.action] } as never;
      const result = await authClient.admin.hasPermission({
        role: value.role as RoleName,
        permissions,
      });
      setRemoteResult(
        result.success ? t`Server allowed this permission` : t`Server denied this permission`
      );
    },
  });

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
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t`Resource`}</TableHead>
                  {roleNames.map((roleName) => (
                    <TableHead key={roleName}>{labelFor(roleName)}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(accessControlStatement).map(([resourceName, actions]) => (
                  <TableRow key={resourceName}>
                    <TableCell className="font-medium">{labelFor(resourceName)}</TableCell>
                    {roleNames.map((roleName) => (
                      <TableCell key={roleName}>
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
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{t`Permission check`}</CardTitle>
            <CardDescription>
              {t`Compare synchronous role policy with the authenticated server check.`}
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
                <div className="flex flex-col gap-4">
                  <form.AppField name="role">
                    {(field) => (
                      <field.NativeSelectField id="permission-role" label={t`Role`}>
                        {roleNames.map((name) => (
                          <NativeSelectOption key={name} value={name}>
                            {labelFor(name)}
                          </NativeSelectOption>
                        ))}
                      </field.NativeSelectField>
                    )}
                  </form.AppField>
                  <form.Field name="resource">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor="permission-resource">{t`Resource`}</FieldLabel>
                        <NativeSelect
                          id="permission-resource"
                          value={field.state.value}
                          onChange={(event) => {
                            const resource = event.target.value as AccessControlResource;
                            field.handleChange(resource);
                            form.setFieldValue("action", accessControlStatement[resource][0]);
                            setRemoteResult(undefined);
                          }}
                        >
                          {Object.keys(accessControlStatement).map((name) => (
                            <NativeSelectOption key={name} value={name}>
                              {labelFor(name)}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </Field>
                    )}
                  </form.Field>
                  <form.Subscribe selector={(state) => state.values.resource}>
                    {(resource) => (
                      <form.AppField name="action">
                        {(field) => (
                          <field.NativeSelectField id="permission-action" label={t`Action`}>
                            {accessControlStatement[resource as AccessControlResource].map(
                              (name) => (
                                <NativeSelectOption key={name} value={name}>
                                  {labelFor(name)}
                                </NativeSelectOption>
                              )
                            )}
                          </field.NativeSelectField>
                        )}
                      </form.AppField>
                    )}
                  </form.Subscribe>
                  <form.Subscribe selector={(state) => state.values}>
                    {(value) => {
                      const permissions = { [value.resource]: [value.action] } as never;
                      const localAllowed = authClient.admin.checkRolePermission({
                        role: value.role as RoleName,
                        permissions,
                      });
                      return (
                        <p className="text-sm">
                          {t`Local policy`}:{" "}
                          <Badge variant={localAllowed ? "default" : "outline"}>
                            {localAllowed ? t`Allowed` : t`Denied`}
                          </Badge>
                        </p>
                      );
                    }}
                  </form.Subscribe>
                  <form.SubmitButton variant="outline">{t`Check on server`}</form.SubmitButton>
                  {remoteResult ? <p className="text-sm font-medium">{remoteResult}</p> : null}
                </div>
              </form.AppForm>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
