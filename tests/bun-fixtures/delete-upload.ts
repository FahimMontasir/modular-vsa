import { deleteFile } from "../../packages/_storage/src/index";

const key = Bun.argv[2];
if (!key) throw new Error("Usage: delete-upload.ts <key>");

await deleteFile(key);
