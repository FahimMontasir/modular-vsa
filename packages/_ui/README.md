# @modular-vsa/ui

Shared, framework‑agnostic UI primitives built with **shadcn/ui** using the **Base UI** style, styled via Tailwind CSS.

Shared, framework‑agnostic UI primitives built with **shadcn/ui** and styled via TailwindCSS.
Shadcn official doc: [https://ui.shadcn.com/docs](https://ui.shadcn.com/docs)
Shadcn all components: [https://ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components)

## Purpose

- Provide a single source of UI components (`Button`, `Card`, etc.) that can be used across web apps.
- Keep design tokens, global CSS, and component defaults centralized.
- Keep the UI layer easy for LLMs to read and extend (open‑code approach).

## Current setup (source of truth)

These values come from `components.json` and `package.json` in this package:

- **Style**: `base-nova` (Base UI)
- **Tailwind CSS file**: `src/styles/globals.css`
- **Base color**: `neutral`
- **CSS variables**: enabled (`tailwind.cssVariables: true`)
- **RSC**: disabled (`rsc: false`)
- **Icon library**: `lucide`
- **Aliases**:
  - `components`: `@modular-vsa/ui/components`
  - `ui`: `@modular-vsa/ui/components`
  - `lib`: `@modular-vsa/ui/lib`
  - `utils`: `@modular-vsa/ui/lib/utils`
  - `hooks`: `@modular-vsa/ui/hooks`

## What this package exports

- `@modular-vsa/ui/components/*` → all UI components under `src/components/`
- `@modular-vsa/ui/hooks/*` → hooks under `src/hooks/` (ex: `use-mobile`)
- `@modular-vsa/ui/lib/utils` → shared helpers like `cn`
- `@modular-vsa/ui/globals.css` → Tailwind + theme tokens

## Package layout

```text
packages/_ui/
├── src/
│   ├── components/        # Individual UI components (button.tsx, card.tsx, etc.)
│   ├── hooks/             # UI hooks (use-mobile, etc.)
│   ├── lib/               # utils (cn), helpers
│   └── styles/            # Global Tailwind CSS styles (globals.css)
├── components.json        # shadcn/ui configuration
├── postcss.config.mjs
└── package.json
```

## Usage

```tsx
import "@modular-vsa/ui/globals.css";
import { Button } from "@modular-vsa/ui/components/button";

export default function Example() {
  return <Button>Click me</Button>;
}
```

## Adding components

Run the shadcn CLI from the package root:

```bash
bunx shadcn@latest add <component> -c .
```

Or use the package script:

```bash
bun run add:ui -- <component> -c .
```

New components are scaffolded under `src/components/` and automatically added to `components.json`.

## UI component file map

Each row maps a file to what it does and where it typically fits in the UI.

| File | What it does | Where to use |
| --- | --- | --- |
| `src/components/accordion.tsx` | Expand/collapse grouped content sections. | FAQ sections, settings panels. |
| `src/components/alert-dialog.tsx` | Confirmation dialog for destructive or blocking actions. | Delete, sign‑out, irreversible actions. |
| `src/components/alert.tsx` | Inline status message with icon and emphasis. | Form feedback, page banners. |
| `src/components/aspect-ratio.tsx` | Keeps media at a fixed ratio. | Images, videos, thumbnails. |
| `src/components/avatar.tsx` | User image with fallback initials. | Profile headers, user lists. |
| `src/components/badge.tsx` | Small status/label pill. | Tags, counts, statuses. |
| `src/components/breadcrumb.tsx` | Hierarchical navigation trail. | Multi‑level pages, settings. |
| `src/components/button-group.tsx` | Grouped buttons / segmented actions. | Toolbars, filters, segmented controls. |
| `src/components/button.tsx` | Primary action trigger. | Forms, dialogs, call‑to‑actions. |
| `src/components/calendar.tsx` | Calendar/date selection UI. | Date filters, schedulers, forms. |
| `src/components/card.tsx` | Surface container with header/content slots. | Dashboards, content blocks. |
| `src/components/carousel.tsx` | Horizontal slider for content. | Galleries, featured content. |
| `src/components/chart.tsx` | Data visualization primitives (Recharts). | Analytics, reports, metrics. |
| `src/components/checkbox.tsx` | Multi‑select control. | Forms, bulk selection. |
| `src/components/collapsible.tsx` | Toggle visibility for a section. | Advanced settings, nested details. |
| `src/components/combobox.tsx` | Searchable select input. | Large data sets, async options. |
| `src/components/command.tsx` | Command palette / fuzzy search UI. | Global search, quick actions. |
| `src/components/context-menu.tsx` | Right‑click / secondary menu. | Tables, lists, canvases. |
| `src/components/dialog.tsx` | Modal dialog for focused tasks. | Forms, confirmations, wizards. |
| `src/components/direction.tsx` | RTL/LTR provider and hook. | Root app wrapper for RTL. |
| `src/components/drawer.tsx` | Edge/bottom panel overlay. | Mobile nav, quick actions. |
| `src/components/dropdown-menu.tsx` | Triggered menu list. | Action menus, profile menus. |
| `src/components/empty.tsx` | Empty state layout with actions. | Zero results, first‑run screens. |
| `src/components/field.tsx` | Form field layout (label/help/errors). | Forms and input groups. |
| `src/components/hover-card.tsx` | Rich preview on hover/focus. | User previews, quick details. |
| `src/components/input-group.tsx` | Input with addons/buttons/icons. | Search bars, price inputs. |
| `src/components/input-otp.tsx` | One‑time password input. | Auth flows, 2FA. |
| `src/components/input.tsx` | Single‑line text input. | Forms, search, filters. |
| `src/components/item.tsx` | List row with media/content/actions. | Notifications, feeds, lists. |
| `src/components/kbd.tsx` | Keyboard shortcut badge. | Tooltip hints, menus. |
| `src/components/label.tsx` | Accessible label text. | Forms, toggles, inputs. |
| `src/components/menubar.tsx` | App‑style menu bar. | Desktop‑style navigation. |
| `src/components/native-select.tsx` | Native select element with styling. | Mobile‑friendly selects. |
| `src/components/navigation-menu.tsx` | Multi‑level navigation menu. | Header nav, mega menus. |
| `src/components/pagination.tsx` | Page navigation controls. | Tables, search results. |
| `src/components/popover.tsx` | Floating non‑modal panel. | Filters, quick edits. |
| `src/components/progress.tsx` | Determinate progress bar. | Uploads, multi‑step flows. |
| `src/components/radio-group.tsx` | Single‑select options. | Forms, settings. |
| `src/components/resizable.tsx` | Resizable panel layout. | Dashboards, split panes. |
| `src/components/scroll-area.tsx` | Scrollable area with custom scroll. | Long lists, sidebars. |
| `src/components/select.tsx` | Custom select (portal, styling). | Forms, filters. |
| `src/components/separator.tsx` | Visual divider. | Sections, menus, cards. |
| `src/components/sheet.tsx` | Side panel overlay. | Settings, secondary tasks. |
| `src/components/sidebar.tsx` | Sidebar layout and navigation. | App shell navigation. |
| `src/components/skeleton.tsx` | Loading placeholders. | Cards, lists, tables. |
| `src/components/slider.tsx` | Range slider input. | Filters, media controls. |
| `src/components/sonner.tsx` | Toast notification system. | Global alerts, saves. |
| `src/components/spinner.tsx` | Inline loading indicator. | Buttons, inline states. |
| `src/components/switch.tsx` | Binary toggle. | Settings, feature flags. |
| `src/components/table.tsx` | Table layout with slots. | Data grids, reports. |
| `src/components/tabs.tsx` | Tabbed views. | Settings, content switching. |
| `src/components/textarea.tsx` | Multi‑line input. | Comments, descriptions. |
| `src/components/toggle-group.tsx` | Segmented multi/single toggle set. | Filters, view toggles. |
| `src/components/toggle.tsx` | Single toggle button. | Toolbar actions. |
| `src/components/tooltip.tsx` | Short hint on hover/focus. | Icon buttons, labels. |

## Notes for agents

- **Forms:** Use `Field` for label/help/error layout. Use `InputGroup` for addons or inline actions.
- **Lists vs inputs:** Use `Item` for content rows with media/actions. Use `Field` when a row contains a form control.
- **Overlays:** `Tooltip` (tiny hints) → `HoverCard` (rich preview) → `Popover` (non‑modal) → `Dialog` (modal) → `Sheet/Drawer` (edge panels).
- **Feedback:** `Alert` for inline messaging, `Sonner` for toasts, `Skeleton` for layout placeholders, `Spinner` for inline loading, `Empty` for zero‑state guidance.
- **RTL:** Use `DirectionProvider` and set `dir="rtl"` on the root when needed.
- **Styling:** Update `src/styles/globals.css` for tokens/themes.
- **Keep components framework‑agnostic:** avoid platform‑specific APIs in shared components.

## Documentation

See the root **README.md** for monorepo scripts, build steps, and testing.
