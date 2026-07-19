# @modular-vsa/storage

S3-compatible object storage using [Bun's native S3 API](https://bun.sh/docs/runtime/s3). Uses Garage (via Docker) in development — works with any S3 provider (AWS S3, Cloudflare R2, MinIO, etc.) in production.

## Setup

### 1. Start Garage

```bash
# Run from the repository root.
bun run dkr:start
```

This starts Garage (port 3900) and the Garage WebUI (port 3909).

### 2. Garage WebUI

The Web UI is available at **http://localhost:3909**.

**Login:** `admin` / `admin`

The login endpoint is `POST /api/auth/login` with JSON body `{"username":"admin","password":"admin"}`. Uses session cookies for authenticated API calls.

Use it to browse buckets, view objects, and manage keys.

### 3. Configure access keys

Garage starts with an admin token. Create a key and bucket:

```bash
# Set admin token
export GARAGE_ADMIN_TOKEN=IPp4QQR7oWkyd+WtLb22U2WDnJF1KwxA/eHC/EF5YiY=

# Create access key
garage key create dev-key

# Create bucket
garage bucket create modular-vsa

# Allow key to access bucket
garage bucket allow modular-vsa --key <key-id> --read --write --owner
```

Copy the `AccessKeyId` and `SecretAccessKey` into your `.env`:

```
S3_ACCESS_KEY_ID=<access-key-id>
S3_SECRET_ACCESS_KEY=<secret-access-key>
S3_BUCKET=modular-vsa
S3_ENDPOINT=http://localhost:3900
S3_REGION=garage
```

## Usage

```ts
import {
  s3,
  uploadFile,
  deleteFile,
  getSignedUrl,
  readFileText,
  listFiles,
} from "@modular-vsa/storage";

// Upload a file
await uploadFile("path/to/file.txt", "Hello World");

// Read a file
const text = await readFileText("path/to/file.txt");

// Get a presigned URL (e.g. for direct browser uploads)
const url = getSignedUrl("path/to/file.txt", { expiresIn: 3600 });

// List objects
const objects = await listFiles({ prefix: "path/to/" });

// Check if file exists
const exists = await s3.exists("path/to/file.txt");

// Delete a file
await deleteFile("path/to/file.txt");
```

## Server-side upload route

The `@modular-vsa/storage` package exports a composable Elysia route plugin at `@modular-vsa/storage/server/routes`:

```ts
import { StorageRoutes } from "@modular-vsa/storage/server/routes";

// Mount in your Elysia app
app.use(StorageRoutes);
```

The route `POST /upload` accepts `multipart/form-data` with a `file` field and returns `{ key, url }`.

## API

| Function                          | Description                          |
| --------------------------------- | ------------------------------------ |
| `createS3Client()`                | Create a new S3 client from env vars |
| `s3`                              | Default singleton S3 client          |
| `uploadFile(key, data, options?)` | Upload a file                        |
| `readFile(key)`                   | Get an `S3File` reference (lazy)     |
| `readFileText(key)`               | Read file as string                  |
| `readFileJson(key)`               | Read file as JSON                    |
| `deleteFile(key)`                 | Delete a file                        |
| `fileExists(key)`                 | Check if file exists                 |
| `getSignedUrl(key, options?)`     | Generate a presigned URL             |
| `getFileStat(key)`                | Get file metadata (size, etag, etc.) |
| `listFiles(options?)`             | List objects in the bucket           |

## Environment Variables

| Variable               | Default                 | Description            |
| ---------------------- | ----------------------- | ---------------------- |
| `S3_ACCESS_KEY_ID`     | `garage-access`         | S3 access key          |
| `S3_SECRET_ACCESS_KEY` | `garage-secret`         | S3 secret key          |
| `S3_BUCKET`            | `modular-vsa`           | Bucket name            |
| `S3_ENDPOINT`          | `http://localhost:3900` | S3 endpoint URL        |
| `S3_REGION`            | `garage`                | S3 region              |
| `GARAGE_ADMIN_TOKEN`   | `admin`                 | Garage admin API token |
