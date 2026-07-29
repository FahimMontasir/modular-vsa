# Config

Shared TypeScript compiler configuration only.

- Extend `tsconfig.base.json` from workspace packages.
- Keep runtime, environment, lint, build, and test configuration with the package that uses it.
- Add package-specific compiler options in that package rather than broadening the base unnecessarily.
