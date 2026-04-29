# Server App

Backend server for the modular VSA application, built with Elysia.

## Architecture

### `src/`

Main source code directory containing server logic.

#### `index.ts`

The entry point of the server. Sets up the Elysia app with:

- Global error handling
- CORS configuration
- OpenAPI documentation
- Authentication routes
- API routes via `APIV1`

#### `v1-routes.ts`

Main API versioning layer. Aggregates all API v1 routes from various packages (e.g., `HomeRoutes`).

**Purpose**: Keep API versioning organized and maintainable. Import and register routes here, not in `index.ts`.

#### `utils/`

**Scope**: Server-only configuration and utility functions that cannot be imported by other packages.

These utilities are tightly coupled to this server app's implementation details and are **not meant to be shared**. Examples include:

- `globalError.ts` - Global error handling middleware
- `cors.ts` - CORS configuration specific to this server

## Development

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# View API documentation
# Open http://localhost:3000/api-docs
```

## Environment

Configuration is managed via `@modular-vsa/env/server`. See `.env` file or package documentation for required variables.
