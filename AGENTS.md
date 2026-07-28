# Repository Agent Instructions

## Skills First

Before editing files for a substantial task:

1. Inspect the skills available in `.agents/skills/` and select any whose name or description matches the task.
2. Read each selected skill's complete `SKILL.md` before making changes. Follow its workflow and load only the referenced files needed for the task.
3. Prefer the most specific applicable skill. Use multiple skills only when the task genuinely spans multiple concerns.
4. Treat repository skills as active project instructions, not optional background material. Re-check them when the task changes scope.

Common repository skills include Bun, Drizzle ORM, ElysiaJS, frontend design, TDD, architecture review, and React performance guidance. Discover the current set from `.agents/skills/` rather than relying on this list alone.

<!-- intent-skills:start -->

## TanStack Intent Skill Loading

Before editing files for a substantial task:

- Run `bunx @tanstack/intent@latest list` from the workspace root to discover skills shipped by installed packages.
- If a listed skill matches the task, run `bunx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Read and follow the complete loaded `SKILL.md`.
- In this monorepo, always run discovery from the workspace root and prefer the skill associated with the package being changed.
- Prefer the most specific skill. Load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

## Current Package Documentation with Context7

Use Context7 whenever a task depends on a third-party package, framework, SDK, or API and current documentation could affect the implementation. This includes new integrations, setup and configuration, unfamiliar APIs, version-sensitive behavior, migrations, and library-specific code examples.

1. Determine the package and installed version from the relevant `package.json`, workspace catalog, or lockfile.
2. Resolve the official or closest matching Context7 library ID using the package name and the full task as the query.
3. Query Context7 for the specific API or problem, requesting version-specific documentation when available.
4. Base implementation decisions on the retrieved documentation instead of memory or training data.
5. Prefer official package documentation over community forks. If Context7 has no suitable source, use the package's official documentation or source code and state the fallback.

Repository skills and package-shipped TanStack skills define the project workflow and known pitfalls; Context7 supplies current package API facts and examples. Use both when both apply. When documentation differs across versions, follow the version installed in this repository unless the task explicitly includes an upgrade.

## Working Order

For substantial package-related work, use this order:

1. Inspect the affected package and nearby existing patterns.
2. Load relevant `.agents/skills` guidance.
3. Run TanStack Intent discovery and load any matching installed-package skills.
4. Consult Context7 for current, version-appropriate package documentation.
5. Implement, then run the narrowest relevant checks before broader validation.
