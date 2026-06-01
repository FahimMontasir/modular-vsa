import { Trans } from "@lingui/react/macro";
import { useState, useRef } from "react";

import { logger } from "@modular-vsa/shared/common/logger";
import { Button } from "@modular-vsa/ui/button";
import { LanguageToggle } from "@modular-vsa/ui/language";
import { toast } from "@modular-vsa/ui/sonner";
import { ThemeToggle } from "@modular-vsa/ui/theme";

import { useGetAllPostsQuery, useUploadMutation } from "../api/query";

export function HomePage() {
  const { data } = useGetAllPostsQuery();
  const uploadMutation = useUploadMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  logger.info("HomePage data", data);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  }

  function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Please select a file first");
      return;
    }
    uploadMutation.mutate(file);
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <div className="grid gap-6">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">
            <Trans>API Status</Trans>
          </h2>
          <Button onClick={() => toast("hello")}>
            <Trans>Check</Trans>
          </Button>
          <ThemeToggle />
          <LanguageToggle />
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">
            <Trans>File Upload</Trans>
          </h2>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              aria-label="Select file to upload"
              onChange={handleFileChange}
              className="file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-sm file:text-primary-foreground"
            />
            <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
              <Trans>Upload</Trans>
            </Button>
          </div>
          {preview && (
            <div className="mt-3">
              <img src={preview} alt="Preview" className="max-h-48 rounded border object-contain" />
            </div>
          )}
          {uploadMutation.data && (
            <p className="mt-2 text-xs text-muted-foreground">
              Uploaded: <code className="rounded bg-muted px-1">{uploadMutation.data.key}</code>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
