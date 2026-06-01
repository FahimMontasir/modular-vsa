import { t } from "elysia";

export const StorageSchema = {
  UploadBody: t.Object({
    file: t.File(),
    key: t.Optional(t.String()),
  }),
  UploadResponse: t.Object({
    key: t.String(),
    url: t.String(),
  }),
};
