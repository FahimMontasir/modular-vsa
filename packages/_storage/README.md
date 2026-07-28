# `@modular-vsa/storage`

S3-compatible object storage built on Bun's native `S3Client`. Production can use AWS S3,
Cloudflare R2, or another compatible provider; local development uses Garage.

## Local development

Run this once from the repository root:

```bash
bun dev
```

Garage 2.3 starts as a persistent single-node service and automatically creates the access key and
`modular-vsa` bucket from `apps/server/.env.local`. No layout, key, or bucket commands are required.

| Service          | URL / credentials     |
| ---------------- | --------------------- |
| S3 endpoint      | http://localhost:3900 |
| Garage dashboard | http://localhost:3909 |
| Dashboard login  | `admin` / `admin`     |

Use `bun run dkr:stop` to stop infrastructure. `bun run dkr:down` removes containers and the
network but preserves named volumes.

## Usage

```ts
import {
  deleteFile,
  getSignedUrl,
  listFiles,
  readFileText,
  uploadFile,
} from "@modular-vsa/storage";

await uploadFile("path/to/file.txt", "Hello World");
const text = await readFileText("path/to/file.txt");
const url = getSignedUrl("path/to/file.txt", { expiresIn: 3600 });
const objects = await listFiles({ prefix: "path/to/" });
await deleteFile("path/to/file.txt");
```

The server route plugin is available from `@modular-vsa/storage/server/routes`. It exposes the
multipart `POST /upload` route when mounted inside an Elysia route group.

## Environment

| Variable               | Local value                          |
| ---------------------- | ------------------------------------ |
| `S3_ACCESS_KEY_ID`     | Garage-compatible development key    |
| `S3_SECRET_ACCESS_KEY` | Garage-compatible development secret |
| `S3_BUCKET`            | `modular-vsa`                        |
| `S3_ENDPOINT`          | `http://localhost:3900`              |
| `S3_REGION`            | `garage`                             |

All storage credentials in the tracked `.env.local` are local-only. Use deployment secrets for any
shared or production S3 provider.
