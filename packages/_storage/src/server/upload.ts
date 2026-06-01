import { uploadFile, getSignedUrl } from "../index";

export async function uploadToS3(file: File, key?: string) {
  const fileKey = key ?? `${Date.now()}-${file.name}`;
  const buffer = await file.arrayBuffer();
  await uploadFile(fileKey, buffer, { type: file.type });

  return {
    key: fileKey,
    url: getSignedUrl(fileKey, { expiresIn: 86400 }),
  };
}
