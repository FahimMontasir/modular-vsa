import { useLingui } from "@lingui/react/macro";
import { ActivityIcon, DatabaseIcon, FileUpIcon, ShieldCheckIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { roleHasPermission } from "@modular-vsa/auth/access-control";
import { authClient } from "@modular-vsa/auth/web/client";
import { NotificationPermissionAlert } from "@modular-vsa/notification/components/notification-permission-alert";
import { PageContainer } from "@modular-vsa/shared/web/components/page-container";
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
import { useAppForm } from "@modular-vsa/ui/form";
import { Input } from "@modular-vsa/ui/input";

import {
  useCreatePostMutation,
  useDeletePostMutation,
  useGetAllPostsQuery,
  useUpdatePostMutation,
  useUploadMutation,
} from "../api/query";

export function HomePage() {
  const { t } = useLingui();
  const sessionQuery = authClient.useSession();
  const { data: posts } = useGetAllPostsQuery();
  const uploadMutation = useUploadMutation();
  const createMutation = useCreatePostMutation();
  const updateMutation = useUpdatePostMutation();
  const deleteMutation = useDeletePostMutation();
  const [preview, setPreview] = useState<string | null>(null);
  const role = sessionQuery.data?.user.role ?? "director";
  const roleLabel = role === "admin" ? t`Administrator` : t`Director`;
  const canManageContent = roleHasPermission(role, { post: ["create"] });

  const postForm = useAppForm({
    defaultValues: { title: "", content: "", published: false },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync({
        title: value.title.trim(),
        content: value.content.trim(),
        published: value.published,
      });
      postForm.reset();
    },
  });
  const uploadForm = useAppForm({
    defaultValues: { file: null as File | null },
    onSubmit: async ({ value }) => {
      if (!value.file) return;
      await uploadMutation.mutateAsync(value.file);
      uploadForm.reset();
      setPreview(null);
    },
  });

  function previewFile(file: File | null) {
    if (!file) {
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") setPreview(reader.result);
    });
    reader.readAsDataURL(file);
  }

  return (
    <PageContainer>
      <NotificationPermissionAlert />
      <section className="grid gap-4 rounded-xl border bg-card p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">{t`Control plane overview`}</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {t`Welcome, ${sessionQuery.data?.user.name ?? t`operator`}.`}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            {t`The portal is connected to Better Auth, the Elysia API, PostgreSQL, Redis, and S3-compatible storage. Your role determines which controls are available.`}
          </p>
        </div>
        <Badge variant={canManageContent ? "default" : "secondary"}>{roleLabel}</Badge>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatusCard icon={ShieldCheckIcon} label={t`Authentication`} value={t`Session active`} />
        <StatusCard
          icon={ActivityIcon}
          label={t`Authorization`}
          value={canManageContent ? t`Full access` : t`Read only`}
        />
        <StatusCard
          icon={DatabaseIcon}
          label={t`Posts endpoint`}
          value={t`${posts.length} records`}
        />
        <StatusCard
          icon={FileUpIcon}
          label={t`Storage endpoint`}
          value={canManageContent ? t`Upload enabled` : t`Admin only`}
        />
      </section>

      {canManageContent && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t`Create post`}</CardTitle>
              <CardDescription>{t`Exercise the permission-protected POST endpoint.`}</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void postForm.handleSubmit();
                }}
              >
                <postForm.AppForm>
                  <FieldGroup>
                    <postForm.AppField
                      name="title"
                      validators={{
                        onBlur: ({ value }) => (value.trim() ? undefined : t`Enter a title.`),
                      }}
                    >
                      {(field) => (
                        <field.TextField
                          id="post-title"
                          label={t`Title`}
                          maxLength={200}
                          required
                        />
                      )}
                    </postForm.AppField>
                    <postForm.AppField
                      name="content"
                      validators={{
                        onBlur: ({ value }) => (value.trim() ? undefined : t`Enter post content.`),
                      }}
                    >
                      {(field) => (
                        <field.TextareaField
                          id="post-content"
                          label={t`Content`}
                          maxLength={5000}
                          required
                        />
                      )}
                    </postForm.AppField>
                    <postForm.AppField name="published">
                      {(field) => (
                        <field.SwitchField id="post-published" label={t`Publish immediately`} />
                      )}
                    </postForm.AppField>
                    <Field>
                      <postForm.SubmitButton>{t`Create post`}</postForm.SubmitButton>
                    </Field>
                  </FieldGroup>
                </postForm.AppForm>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t`File upload`}</CardTitle>
              <CardDescription>
                {t`Exercise the storage:upload permission and endpoint.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void uploadForm.handleSubmit();
                }}
              >
                <uploadForm.AppForm>
                  <FieldGroup>
                    <uploadForm.Field
                      name="file"
                      validators={{
                        onSubmit: ({ value }) => (value ? undefined : t`Select a file to upload.`),
                      }}
                    >
                      {(field) => (
                        <Field
                          data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                        >
                          <FieldLabel htmlFor="upload-file">{t`Select file to upload`}</FieldLabel>
                          <Input
                            id="upload-file"
                            type="file"
                            aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            onBlur={field.handleBlur}
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null;
                              field.handleChange(file);
                              previewFile(file);
                            }}
                          />
                        </Field>
                      )}
                    </uploadForm.Field>
                    {preview ? (
                      <img
                        src={preview}
                        alt={t`Selected upload preview`}
                        className="max-h-48 rounded-lg border object-contain"
                      />
                    ) : null}
                    <Field>
                      <uploadForm.SubmitButton>
                        <FileUpIcon data-icon="inline-start" /> {t`Upload file`}
                      </uploadForm.SubmitButton>
                    </Field>
                    {uploadMutation.data ? (
                      <code className="rounded-lg bg-muted p-3 text-xs">
                        {uploadMutation.data.key}
                      </code>
                    ) : null}
                  </FieldGroup>
                </uploadForm.AppForm>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t`Posts`}</CardTitle>
          <CardDescription>{t`Live data from the protected GET /api/v1/home endpoint.`}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-medium">{post.title}</h2>
                <Badge variant={post.published ? "default" : "outline"}>
                  {post.published ? t`Published` : t`Draft`}
                </Badge>
              </div>
              <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">{post.content}</p>
              {canManageContent && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateMutation.mutate({ id: post.id, published: !post.published })
                    }
                  >
                    {post.published ? t`Move to draft` : t`Publish`}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button size="sm" variant="destructive" />}>
                      <Trash2Icon data-icon="inline-start" /> {t`Delete`}
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t`Delete this post?`}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t`This permanently removes “${post.title}”.`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t`Cancel`}</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(post.id)}
                        >
                          {t`Delete post`}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </article>
          ))}
          {posts.length === 0 && (
            <Empty className="md:col-span-2 xl:col-span-3">
              <EmptyMedia variant="icon">
                <DatabaseIcon />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>{t`No posts yet`}</EmptyTitle>
                <EmptyDescription>{t`Administrators can create the first post above.`}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ActivityIcon;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardDescription>{label}</CardDescription>
        <Icon className="text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="font-heading text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
