import { S3Client } from "bun";

import { env } from "@modular-vsa/env/server";

export type Acl =
  | "private"
  | "public-read"
  | "public-read-write"
  | "authenticated-read"
  | "aws-exec-read"
  | "bucket-owner-read"
  | "bucket-owner-full-control"
  | "log-delivery-write";

export function createS3Client() {
  return new S3Client({
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    bucket: env.S3_BUCKET,
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
  });
}

export const s3 = createS3Client();

export function uploadFile(
  key: string,
  data: string | Uint8Array | ArrayBuffer | Blob | Response | Request,
  options?: { type?: string; acl?: Acl }
) {
  return s3.write(key, data, options);
}

export function deleteFile(key: string) {
  return s3.delete(key);
}

export function fileExists(key: string) {
  return s3.exists(key);
}

export function getSignedUrl(
  key: string,
  options?: {
    expiresIn?: number;
    method?: "GET" | "PUT" | "DELETE" | "HEAD" | "POST";
    acl?: Acl;
  }
) {
  return s3.presign(key, options);
}

export function readFile(key: string) {
  return s3.file(key);
}

export function readFileText(key: string) {
  return s3.file(key).text();
}

export function readFileJson<T = unknown>(key: string) {
  return s3.file(key).json() as Promise<T>;
}

export function getFileStat(key: string) {
  return s3.stat(key);
}

export function listFiles(options?: { prefix?: string; maxKeys?: number }) {
  return s3.list(options);
}
