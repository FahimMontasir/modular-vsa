# Portal

React PWA and composition root for browser features.

- `src/routes/` contains thin TanStack file routes; feature pages live in package `src/web` folders.
- `src/routeTree.gen.ts` is generated and must not be edited.
- Shared primitives and tokens come from `@modular-vsa/ui`; server state uses React Query.
- `src/sw.ts` handles background Firebase notifications; foreground events invalidate authoritative queries.
- Analytics must stay anonymous and must not include content or identifiers.

```bash
bun -F @modular-vsa/portal dev
bun -F @modular-vsa/portal build
```

See [`../../packages/_ui/README.md`](../../packages/_ui/README.md), [`../../packages/_firebase/README.md`](../../packages/_firebase/README.md), and [`../../packages/notification/README.md`](../../packages/notification/README.md).
