# Storage

S3-compatible object storage using Bun's `S3Client`; local development uses Garage.

- Core upload/read/list/delete helpers are exported from `@modular-vsa/storage`.
- The authenticated multipart route is exported from `@modular-vsa/storage/server/routes`.
- Validate upload metadata and use explicit object keys.
- Delete only captured keys in tests; never clear a shared bucket or broad prefix.

`bun dev` starts Garage and creates the local bucket. The S3 API is http://localhost:3900; the dashboard is http://localhost:3909 with local login `admin` / `admin`.

Configuration comes from the validated `S3_*` variables in `apps/server/.env.local`. These values are local-only; use deployment secrets for shared or production storage.
