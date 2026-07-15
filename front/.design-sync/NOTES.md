# design-sync notes — pfa

Repo-specific gotchas for future syncs. Read this before re-running.

Project: **PFA DS** — https://claude.ai/design/p/aba2a406-a3d0-41e5-ab59-3481c4a782ba
First sync: 2026-07-15. 98 components, floor cards only (no authored previews yet).

## The one thing to know

**pfa is a Next app, not a component library.** It has no `dist/`, no `main`/`module`/`exports`,
and `noEmit: true`. design-sync's two normal inputs — a compiled stylesheet and a shipped `.d.ts`
tree — therefore don't exist. `.design-sync/prepare.mjs` manufactures both from the app's source.
**Always run it before the converter** (it is `cfg.buildCmd`):

```sh
pnpm ds:prepare
node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ./node_modules \
  --out ./ds-bundle --remote .design-sync/.cache/remote-sync.json --no-render-check
```

## Why each piece exists (don't "simplify" these away)

- **`ds-entry.tsx` uses RELATIVE imports, not `@components/…`.** This deliberately breaks the repo's
  path-alias rule, and it must stay that way: tsc copies the specifier verbatim into the emitted
  `.d.ts`, and the converter's ts-morph project has no `paths` mapping — so with aliases it cannot
  follow the entry to the components, `getExportedDeclarations()` returns nothing, and **all 98
  `<Name>Props` silently degrade to `[key: string]: unknown`**. That was the state before this fix.
- **`dist/types/package.json`** (written by prepare.mjs). `loadDts()` walks up from the types root to
  the nearest `package.json` *with a name* and reads its `types`. Without that manifest it resolves
  `front/index.d.ts`, which doesn't exist, and the prop-extraction fallback never runs.
- **The ts-morph symlink lives at `.design-sync/overrides/node_modules`**, not `.design-sync/`.
  The fork needs it to resolve `ts-morph`; putting it at `.design-sync/` (as the skill's generic
  instruction says) makes tsc resolve a *second* `@types/react` from `ds-entry.tsx` and fail the
  declaration build with "Two different types with this name exist".
- **`overrides/source-kit.mjs` fork** — group from doc frontmatter, not the src path. `src/components/
  {shared,common,brand,sharedLoginForm}/` are code organization, and package-build only honours a
  doc `category:` when the derived group is already `general`. Without the fork half the library is
  grouped by folder and half by taxonomy. Groups now come from `.design-sync/docs/<Name>.md`.
- **`.dark` is widened to `:root`** in prepare.mjs. pfa is dark-only and `src/app/layout.tsx` sets
  `dark` on `<html>`; preview cards and generated designs have no app shell, so without this every
  token falls back to the inert light shadcn scaffolding.
- **`html body { background-color: var(--bg) }` in `ds-styles.src.css`, deliberately UNLAYERED.**
  This one shipped broken on the first upload and the user caught it: every card rendered pfa's
  near-white ink on a white page. Two causes compounding:
  1. The generated cards carry their own `<style>body{margin:0;padding:24px;background:#fff}</style>`
     — `lib/emit.mjs` assumes a light DS. That rule is **unlayered**.
  2. `base.css`'s `html, body { @apply bg-background }` lives in `@layer base`, and **unlayered CSS
     beats any cascade layer regardless of specificity**. So the card's white always won.
  The fix is unlayered (depth 0 in the compiled file) and specificity (0,0,2), which outranks the
  card's `body` (0,0,1). **Do not move this rule inside `@layer`, and do not fork `lib/emit.mjs`**
  (the skill forbids it — it defines the output contract with the app's self-check). If cards ever
  render white again, check this rule survived compilation at depth 0.
- **`@source inline(...)` safelists** in `ds-styles.src.css`. The bundle ships *static* CSS, so the
  design agent can only use classes the app happened to compile. Before safelisting, `gap-8`, `mt-8`,
  `space-y-4`, `grid-cols-4`, `ring-elec`, `text-surface-hi` and `text-danger-solid` did not exist.
  **If you add a token family to `styles/tokens/colors.css`, add it to the safelist too.**
- **Fonts.** The app gets Geist/Geist Mono from `next/font/google`, which only exists inside Next.
  `ds-styles.src.css` sources the same families from the Google Fonts host instead, and binds
  `--font-geist-sans` / `--font-geist-mono` on `:root`. Validate reports `[FONT_REMOTE]` — expected.

## Deliberately excluded from the DS

| Excluded | Why |
|---|---|
| `src/components/ui/card.tsx` | **Dead code.** Zero importers since COS-100 unified cards on GlowCard. Its `CardTitle` also collides with the real one in `shared/CardSectionHeader`. Worth deleting from the repo. |
| `Spinner` (`common/Spinner.tsx`) | `next/image` + a `/assets/…` path. Pulled Next's whole image runtime into the bundle (796 KB → 648 KB once removed) and it can't render outside Next. Excluded via `componentSrcMap: {"Spinner": null}`. |
| `NavBar`, `UserMenu`, `SessionWatcher`, `SharedLoginForm` | Bound to next/navigation, auth context and zustand. Would drag server-side deps into a browser bundle. Revisit only with a `cfg.provider` chain. |

## Preview authoring — four traps, all now fixed (2026-07-15)

Every one of these failed **silently**: the card still rendered and still looked plausible. They were
found by fanning subagents over the library, not by reading code. If a card ever looks subtly wrong,
suspect this list first.

1. **Sizing utilities were not safelisted.** `w-*`/`h-*`/`size-*`/`max-w-*` only existed if the app
   happened to use them. `w-28`, `w-40`, `h-64`, `max-w-md`, `max-w-sm` did not exist — elements just
   ignored the class and rendered full-width. It blocked ScrollArea outright (no fixed height → never
   overflows → no scrollbar) and silently unconstrained the GlowCard preview. Now safelisted.
   `max-h-72` is NOT a substitute for `h-*`: Radix's Viewport is `size-full`, which can't resolve
   against auto-height + max-height — content spills outside the box instead of scrolling.
2. **`.design-sync/previews/` was not in the Tailwind content scan.** Only `../src` was. Any class used
   in a preview but not in the app compiled to nothing. Fixed with `@source "./previews"`.
3. **`dark:` utilities were dead in the preview host.** `globals.css` declares
   `@custom-variant dark (&:is(.dark *))`; the app satisfies it via `<html className="dark">`, the
   preview host emits a bare `<html><body>`. Measured wrong on 8 shipped components (button, badge,
   input, checkbox, switch, tabs, select, dropdown-menu) — e.g. Switch's thumb was navy instead of
   white. Fixed by re-declaring `@custom-variant dark (&)` in `ds-styles.src.css` (pfa is dark-only, so
   `dark:` is unconditional). The **token** half was already fine via the `:root, .dark` rewrite — this
   was only the variant half. Note this nuances conventions.md's "never add a dark class": correct for
   tokens, but the variant needed widening.
4. **Adding a `viewport` override after a build hard-blocks every targeted rebuild.**
   `sync-hashes.mjs` strips only `cardMode`/`primaryStory` from the grade key, so `viewport` re-keys the
   component and `preview-rebuild.mjs` exits `[CONFIG_STALE]` — and the guard is all-or-nothing per
   invocation, so one stale target blocks its clean siblings. **Always apply config/override changes
   BEFORE the full `package-build.mjs`**, never after. Only the full build re-stamps.

## Contract-extraction gaps (tooling, not fixable from previews)

- Components typed `React.ComponentProps<"input">` lose their native props: `Input.d.ts` and
  `TextInput.d.ts` emit only `ref/className/id/style/children` — `type`, `placeholder`, `disabled`,
  `value`, `onChange`, `aria-invalid` are all absent. Runtime is fine; the contract is thin.
- `Input.d.ts` wrongly emits `children` — `<input>` is a void element.
- `PasswordField.d.ts` declares `registration: UseFormRegisterReturn` without importing the type, so it
  can't typecheck standalone.
- `Button`/`IconButton` spread `React.ComponentProps<"button">`, so `disabled`/`aria-label` pass through
  but are undocumented in the `.d.ts`.

## Findings about the app itself (surfaced while authoring — worth a ticket)

- **`src/components/ui/card.tsx` is dead** (see the exclusions table). Also `Badge`, `CategoryComponent`
  and `Progress` have **zero call sites** in `src` — orphaned shadcn/legacy primitives that are now
  documented as DS components. Decide whether they belong.
- `CategoryComponent.isClicked` is dead code (both branches identical), and its `adjustFontColor` helper
  would break on the `oklch()` strings the design system uses — it only works because category colours
  come from the backend as hex.
- `Progress` is unused shadcn leftover; `ProgressTrack` is what the app actually uses for that role and
  has no card.
- `src/components/ui/checkbox.tsx` has no `data-[state=indeterminate]` styling and hardcodes `CheckIcon`,
  so indeterminate would render a checkmark instead of a minus.
- **`Tooltip` has zero real usage in `src`** — its preview is a plausible invention, not a transcription
  of app usage. Worth design sign-off before trusting it as canon.
- `MoneyAmount` does not carry `num` itself (StatTile adds it on the value line), so standalone usages
  need `className="num …"`. Easy to miss.

## Components that genuinely cannot render statically

Not defects — deliberately skipped, recorded so a future run doesn't chase them: sonner's swipe-dismiss /
hover-pause / stacking / enter-exit animations; Radix enter/exit animations and backdrop-blur over real
page content; PasswordField's revealed state (internal `useState`, no prop override); focus-visible rings;
hover states; drag on Dropzone; `IconButton`'s `bordered` vs `danger` are pixel-identical at rest.

`Toaster` is a special case worth knowing: sonner renders nothing statically and `toast` is not exported
from `ds-entry.tsx`. Importing `toast` from `"sonner"` inside a preview would bundle a **second** sonner
instance whose store the DS-bundle Toaster never subscribes to — the toast would silently never appear.
The preview instead fires the toast through `ExportButton` (the app's only real `toast()` caller, and on
the DS surface, so it shares the bundle's sonner instance).

## Known render warns

- `[RENDER_SKIPPED]` — the render check has **never** run. The user declined the playwright/chromium
  install on the first sync, so the bundle is machine-unverified. A future sync that installs
  playwright will produce genuinely new information; treat the first real run's findings as new, not
  as regressions.
- `[FONT_REMOTE]` — expected, see Fonts above.
- `tokens: 3 missing, below threshold` — not investigated; under the converter's warn threshold.

## Re-sync risks — what can silently go stale

- **`dtsPropsFor.TextInput` is hand-written** and mirrors `Input`'s contract. `TextInput` is typed
  `React.ComponentProps<typeof Input>` and its emitted `.d.ts` keeps an aliased `import { Input } from
  "@components/ui/input"` that ts-morph can't resolve. If `Input`'s props change, this rots silently.
- **The category stubs in `.design-sync/docs/` are a full enumeration** (98 files, one per component).
  A component added to `ds-entry.tsx` without a matching stub lands in `general`. A stub for a
  component that no longer exists is harmless but dead.
- **`componentSrcMap` is a full enumeration too**, because there is no `.d.ts` export list to
  discover from. New components must be added to both it and `ds-entry.tsx`.
- **`prepare.mjs` shells out to `./node_modules/.bin/tsc`** and assumes the front package manager
  installed it. Node ≥ 22 (`nvm use 22.20.0`); the default node on this machine is too old.
- **tsc emits declarations despite type errors** (`emitDeclarationOnly`). If the app grows real type
  errors the tree may be partial without the build failing. Check the `[DTS] parsed N` count — it was
  43 files / 98 components at first sync.
- **Assumed at build time:** tailwindcss 4.3.2 (`@source inline` needs ≥ 4.1), Next 16.1, React 19.2.
