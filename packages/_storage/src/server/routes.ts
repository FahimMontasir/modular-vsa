import { StatusMap } from "elysia";

import { secureAPI } from "@modular-vsa/auth/server/secure-api";

import { uploadToS3 } from "./upload";
import { StorageSchema } from "./validators";

export const StorageRoutes = secureAPI().post(
  "/upload",
  async ({ body }) => {
    return await uploadToS3(body.file, body.key);
  },
  {
    // authenticate: true,
    body: StorageSchema.UploadBody,
    response: {
      [StatusMap.Created]: StorageSchema.UploadResponse,
    },
    detail: {
      summary: "Upload a file",
      description: "Upload a file to S3-compatible storage",
    },
  }
);

export type APIStorageType = typeof StorageRoutes;
