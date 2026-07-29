# Shared utilities

Small runtime utilities reused across packages.

- `src/common/` may run anywhere.
- `src/server/` is server-only; `src/web/` is browser-only.
- Common code must not import server or web modules.
- Keep feature logic in its feature package, configuration in `__env__`, UI in `_ui`, and database code in `_db`.
- Promote an abstraction here only after multiple packages need the same stable behavior.
- Unit-test custom deterministic logic, not library internals.
