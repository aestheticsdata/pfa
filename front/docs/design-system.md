# PFA Design System

The vocabulary the front-end is built from: colour, type, radius, elevation, and the component
primitives that consume them. Read this before adding UI — most visual decisions are already made,
and the point of the system is that you spend your decisions on the product, not on picking a grey.

Built with Tailwind CSS v4 (CSS-first: no `tailwind.config.js` — the theme lives in CSS via `@theme`).
Established across the design-system epic (Linear: COS-43, 64→70, 81→96, 98, 100).

Every value here was read out of the code, not remembered. **Last verified against `master` at
`535c5b9` (COS-105).** Tokens drift — `--line-soft` moved between this doc being drafted and being
committed — so if a number here disagrees with the CSS, the CSS wins. Fix the doc.

---

## 1. Ground rules

These are decisions, not preferences. They were argued once so they don't have to be argued again.

**Use a token, never a raw value.** No `text-[13px]`, no `rounded-[6px]`, no `bg-[#121212]`, no raw
Tailwind palette (`gray-400`, `cyan-500`). Every one of those has a canonical equivalent below. `src`
currently contains **zero raw Tailwind palette colours** — keep it that way. Accepted exceptions are
listed in §10, and they're narrow.

**Tokens are cheap; make one.** When you face a real design decision — a colour, a radius, a
tracking, an elevation — add a well-named token rather than an ad-hoc value. (A *new family* also
needs adding to the Claude Design safelist — see §13.) Many good tokens beat
scattered literals. Don't argue "avoid token proliferation"; that's not this project's failure mode.

**No `@apply` to bundle utilities.** Don't extract a repeated cluster of utility classes into a CSS
class. Repetition of *utilities* is fine; repetition of *UI* is what gets extracted — into a React
component or a shared `className` constant. (The `@apply` calls in `base.css` are base-layer resets,
a different thing.)

**Extract on the first real repeat.** If a pattern shows up twice and is plausibly reusable, factor
it out now, not later. That's how §7's catalogue exists.

**Spacing stays on the numbered scale.** `p-4`, `gap-6`, `px-5.5` (22px), `py-4.5` (18px) — these are
already tokens on a 4px grid. Don't invent named spacing tokens (`--p-modal`); centralise repeated
spacing in the component that owns it.

**Path aliases only.** `@components/…`, `@lib/…`, `@styles/…`. Never `./` or `../`, not even within a
module.

**The app is dark-only.** `<html className="dark">` is hardcoded in `app/layout.tsx`. The `:root`
light block in `tokens/colors.css` is inert shadcn scaffolding — the `.dark` block is the real
palette. Don't spend effort on light mode; it isn't wired up.

---

## 2. Where things live

```
front/styles/
  globals.css              entry — `@custom-variant dark` + ordered imports; no rules of its own
  tokens/
    colors.css             palette + shadcn remap + @theme inline utilities
    radius.css             two radius scales (see §5)
    typography.css         type scale, tracking, fonts, .num
    elevation.css          the shadow scale
  base.css                 base-layer resets (border colour, body, autofill)
  animations.css
  components/
    chrome.css             .pfa-card, .pfa-hdr, .pfa-drawer, .pfa-scrim, scrollbars
    daypicker.css  spendings.css  exceptionals.css  category-detail.css

front/src/components/
  ui/                      shadcn wrappers over Radix primitives — keep flat exports
  shared/                  the PFA primitives (§7)
```

**Layering:** `ui/*` are shadcn components (copied in, restyled onto our tokens) wrapping Radix
(`@radix-ui/*`). Inside a `ui/*` file, the Radix namespace import (`import * as DialogPrimitive` →
`<DialogPrimitive.Close>`) is standard shadcn — keep it. At the consumer level, imports stay **flat**
(`import { DialogContent }`, not `<Dialog.Content>`): that's shadcn's default, and re-running
`shadcn add` regenerates flat files.

---

## 3. Colour

Two layers. The **PFA palette** is the source of truth; the **shadcn semantic tokens** are remapped
onto it so `ui/*` inherits the look for free.

All colours are oklch. Lightness is the first number — it's the thing to reason about.

### Surfaces — the elevation ladder

| Token | Value | Utility | Use |
|---|---|---|---|
| `--surface-base` | `oklch(0.14 0.042 234)` | `bg-surface-base` | page background — the darkest thing |
| `--surface-elev` | `oklch(0.205 0.006 250)` | `bg-surface-elev` | cards, modals, popovers |
| `--surface-hi` | `oklch(0.215 0.007 250)` | `bg-surface-hi` | inset chips, meter tracks, controls |
| `--surface-hover` | `oklch(0.22 0.006 250)` | `bg-surface-hover` | hover state |
| `--line` | `oklch(0.27 0.008 250)` | `border-line` | default border |
| `--line-soft` | `oklch(0.24 0.006 250)` | `border-line-soft` | internal dividers |

> **`--surface-base` is the base of the surface ladder** (`surface-base → surface-elev → surface-hi`).
> Use **`bg-surface-base`** in PFA code. shadcn's own remap (`--background: var(--surface-base)`) gives
> `bg-background` the same colour — keep that inside `ui/*`, but reach for `bg-surface-base` everywhere
> else.

**A card is lighter than the page.** Surfaces get *lighter* as they come forward (0.14 → 0.205 →
0.22). If you find yourself making a card darker than `--surface-base`, you've inverted the system.

**A hairline is only a line if it's lighter than the fill behind it.** `--line-soft` must stay above
*every* surface it draws on — `--surface-base` 0.14, `--surface-elev` 0.205, `--surface-hi` 0.215,
`--surface-hover` 0.22. At 0.20 it sat *under* `--surface-elev`, and every separator on a card
vanished (COS-105). 0.24 clears the highest surface by 0.02 and sits ~0.03 under `--line`. **If you
ever raise a surface above 0.24, raise `--line-soft` with it** — the tightest constraint is
`--surface-hover`, not the card.

### Ink — text

| Token | Value | Utility | Use |
|---|---|---|---|
| `--ink` | `oklch(0.975 0.004 250)` | `text-ink` | primary text, values |
| `--ink-2` | `oklch(0.78 0.005 250)` | `text-ink-2` | secondary text, labels |
| `--ink-3` | `oklch(0.62 0.006 250)` | `text-ink-3` | captions, muted |
| `--ink-4` | `oklch(0.47 0.006 250)` | `text-ink-4` | micro-labels, placeholders |
| `--ink-5` | `oklch(0.30 0.006 250)` | `text-ink-5` | disabled, separators |

Pick by **rank**, not by matching a hex you saw somewhere. `ink` → `ink-5` is a hierarchy.

### Accent and semantic

| Token | Value | Utility | Meaning |
|---|---|---|---|
| `--accent-strong` | `oklch(0.84 0.14 148)` | `text/bg-accent-strong` | brand green — the positive accent |
| `--accent-d` | `oklch(0.55 0.10 148)` | `border-accent-d` | darker green — borders, focus ring |
| `--accent-bg` | `accent-strong / 0.10` | `bg-accent-bg` | green tint fill |
| `--bar-fill` | `linear-gradient(90deg, accent-d, accent-strong)` | (CSS var) | meter/progress fill |
| `--neg` | `oklch(0.72 0.17 25)` | `text-neg` | negative amounts, errors |
| `--neg-bg` | `neg / 0.12` | — | negative tint |
| `--exc` | `oklch(0.70 0.13 240)` | `text/bg-exc` | *achats exceptionnels* (calm blue) |
| `--exc-bg` | `exc / 0.14` | `bg-exc-bg` | exceptionnels tint |
| `--elec` | `oklch(0.72 0.15 230)` | `text/border-elec` | **"aujourd'hui"** — today highlight, active drop target |

> `--accent-strong` is deliberately *not* named `--accent`: shadcn already owns `--accent`, where it
> means "hover surface". Renaming ours avoids a silent collision.

### Danger

Destructive actions have their own set, distinct from `--neg` (which is about *values* being
negative, not actions being dangerous):

| Token | Utility | Use |
|---|---|---|
| `--danger-solid` | `bg-danger-solid` | solid delete-button fill |
| `--on-danger` | `text-on-danger` | text on `--danger-solid` |
| `--danger-surface` | `bg-danger-surface` | inline confirm-bar background |
| `--danger-border-soft` | `border-danger-border-soft` | inline confirm-bar border |

In practice you rarely touch these: use `<Button variant="destructive">`, `<IconButton
variant="danger">`, or `<ConfirmDeleteDialog>`.

### shadcn remap

`--background` → `--surface-base` · `--card` / `--popover` → `--surface-elev` · `--primary` →
`--accent-strong` · `--muted-foreground` → `--ink-3` · `--border` / `--input` → `--line` ·
`--destructive` → `--neg` · `--ring` → `--accent-d`.

Change the PFA palette and shadcn follows — **with one gap**: of the five chart tokens only
`--chart-1` (→ `--accent-strong`), `--chart-4` (→ `--exc`) and `--chart-5` (→ `--neg`) are remapped.
`--chart-2` (`oklch(0.82 0.13 175)`) and `--chart-3` (`oklch(0.80 0.12 210)`) are standalone
literals belonging to no token, so editing the palette leaves them behind.

---

## 4. Typography

Native Tailwind scale (`text-xs` 12 · `sm` 14 · `base` 16 · `lg` 18 · `xl` 20 · `2xl` 24 · `3xl` 30 ·
`4xl` 36), extended with:

| Token | Value | Utility | Use |
|---|---|---|---|
| `--text-2xs` | `0.7rem` (~11px) | `text-2xs` | compact label — overlines, tags |
| `--text-3xs` | `0.5rem` (8px) | `text-3xs` | micro label |
| `--text-display` | `2.5rem` (40px) | `text-display` | hero display number |
| `--text-display-lg` | `3.5rem` (56px) | `text-display-lg` | hero display, wide screens |
| `--tracking-snug` | `-0.01em` | `tracking-snug` | titles/labels — native `tight` (-0.025em) is 2.5× too much |
| `--tracking-caps` | `0.08em` | `tracking-caps` | uppercase micro-labels |

**Fonts:** Geist Sans (`font-sans`, the default) and Geist Mono (`font-mono`) via `next/font`. Those
are the only two the app actually uses — see §11.5 about `font-poppins` / `font-smooch` /
`font-ubuntu`.

**`.num` — use it on every meaningful number.** It's a plain CSS class (not a utility):

```css
.num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
```

Tabular figures stop amounts from jittering as they animate or re-render. It's used across the app —
if you're rendering a figure and it isn't `.num`, that's almost certainly a miss.

---

## 5. Radius — read this, it has a trap

There are **two radius scales with overlapping names and different values.**

**CSS scale** (`--r-*`, consumed by the `styles/components/*.css` partials via `var()`):

| `--r-xs` | `--r-sm` | `--r-md` | `--r-lg` | `--r-xl` |
|---|---|---|---|---|
| 4px | 6px | **10px** | **14px** | **18px** |

**Tailwind utility scale** (`rounded-*` in TSX):

| `rounded-xs` | `rounded-sm` | `rounded-md` | `rounded-lg` | `rounded-xl` | `rounded-2xl` | `rounded-3xl` |
|---|---|---|---|---|---|---|
| 2px | 6px | **8px** | **10px** | **14px** | 16px | 24px |

Only `sm`/`md`/`lg`/`xl` are derived from `--radius: 0.625rem` — retuning `--radius` moves those four
and nothing else. `xs`, `2xl` and `3xl` are Tailwind's stock defaults and don't track it.

> **The same name means different sizes depending on the layer.** `--r-lg` is 14px; `rounded-lg` is
> 10px. Only `sm` (6px) agrees. So `var(--r-lg)` in a CSS partial ≠ `rounded-lg` in a component.
> This is a known smell (§11) — until it's reconciled, check which layer you're in.

In TSX, use `rounded-*`. Don't reach for `var(--r-*)` from a component — with one unavoidable
exception: `lib/dataviz/CategoryBarTooltip.tsx:103` sets radius through an inline `style` object,
where `rounded-*` can't reach, so it legitimately uses `var(--r-*)`. Don't "fix" it.

---

## 6. Elevation

One shadow vocabulary, ramped by depth. Each token is a complete `box-shadow` (soft black drop, plus
a subtle top highlight where present). Declared in `@theme`, so each is available **both** as a
`shadow-*` utility in TSX and as `var(--shadow-*)` in CSS.

| Token | Use |
|---|---|
| `shadow-float` | the FAB — **and any pinned band whose top edge is exposed** (see below) |
| `shadow-card` | the standard card (what `.pfa-card` uses) |
| `shadow-header` | sticky app header |
| `shadow-card-hover` | card hover lift |
| `shadow-popover` | popovers, dropdowns |
| `shadow-drawer` | mobile nav drawer |
| `shadow-modal` | modals |
| `shadow-lightbox` | image lightbox |
| `shadow-hero` | auth card |
| `shadow-primary` | the primary CTA's accent glow |

**Depth is not the only axis — the top highlight is the other one.** Every token except
`shadow-float` carries an `inset 0 1px 0` white highlight. That reads as a bevel when the element's
top edge is occluded (a card, the header tucked under the viewport edge) and as a visible **1px
seam** when the top edge sits in the open. That's why the Dépenses sticky band uses `shadow-float`
and not `shadow-header`, despite being a pinned band at greater depth: `shadow-float` is the only
highlight-free token. Pick by depth *and* by whether the top edge is exposed — picking by depth alone
paints the seam.

Focus rings (`0 0 0 3px …`) are intentionally *not* in this scale — they're a focus affordance, not
depth.

---

## 6b. Layering (z-index)

There is **no z-index token and no designed ladder** — the values are literals spread across four
files. This is the real, verified stacking order; place new overlays against it rather than guessing:

| z | Owner | Where |
|---|---|---|
| `-1` … `3` | in-card decoration (auth grain, gradient rims) | various |
| **30** | Dépenses sticky band `.sp-sticky-zone` — *and* the FAB | `spendings.css:107`, `SpendingView.tsx:220` |
| **35** | viewport-top mask `.pfa-shell::before` (COS-104) | `chrome.css:50` |
| **40** | sticky app header `.pfa-hdr` | `NavBar.tsx:116` |
| **50** | shadcn overlay tier — dialog, popover, select, dropdown, tooltip | vendored `ui/*` defaults |
| **60** | portaled chart tooltip (inline `zIndex`) | `CategoryBarTooltip.tsx:94` |
| **110 / 120** | mobile nav scrim / drawer | `chrome.css` |
| **200 / 201** | category detail backdrop / viewport | `category-detail.css:12,26` |

Two traps this table exists to prevent:

- **30 is doubly assigned.** The sticky band and the FAB both sit at 30 in the root stacking context;
  the tie is broken only by DOM order (the band precedes the FAB, so the FAB paints on top). Adding
  a third thing at 30 makes the outcome depend on where you put it in the tree.
- **The mask must be 35**: above the band (30), below the header (40). It hangs off `.pfa-shell`
  rather than `.pfa-hdr` because the header's `backdrop-filter` makes it a containing block for
  fixed descendants — a `::before` there would resolve against the header, not the viewport.

The clusters have different origins: 30/35/40 were chosen together; 50/60 are vendored shadcn
defaults nobody picked; 110/120 and 200/201 are hand-assigned. Note the pfa detail overlay (200/201)
deliberately outranks the shadcn dialog tier (50) even though it's built on Radix Dialog.

---

## 7. Component primitives

Import via `@components/shared/…`. All merge `className` last (through `cn`), so callers can always
override — but see the GlowCard rule below for when you shouldn't.

### GlowCard — the card

```tsx
import GlowCard from "@components/shared/GlowCard";

<GlowCard className="p-5">…</GlowCard>
<GlowCard as="section" className="p-5">…</GlowCard>   // page-level card
<GlowCard hover className="…">…</GlowCard>            // hover lift + stronger glow
```

`as?: "div" | "section"` (default `"div"`) · `hover?: boolean` (default `false`) · plus
`HTMLAttributes`.

This is **the** card surface: `--surface-elev` fill, a diagonal glow gradient border, `--shadow-card`,
`--r-lg` (14px). 19 components go through it.

> **Invariant (COS-100):** consumers pass only *layout* classes. Don't override `bg-`, `shadow-`, or
> `rounded-` on a GlowCard — that's how the app drifted into hand-rolled cards before. The one
> sanctioned exception is `border-elec` for the "today" highlight.
>
> **`background` is reserved on a `.pfa-card` box.** The fill and the glow border are painted by a
> single two-layer `background` (padding-box fill + border-box gradient over a transparent 1px
> border). So any `bg-*` utility on a GlowCard silently destroys the border, and any effect that
> needs the container's own background — like the `gap-px` hairline trick — cannot share the box and
> needs an inner element. That's exactly why `DividedStrip` wraps a grid inside the card.
>
> The glow border runs at 10–32% alpha over 1px — a deliberately faint rim. "I can barely see the
> border" is the design, not a bug.

> ⚠️ **The unification is not complete — the Dépenses day card is not on GlowCard.** `.sp-day`
> (`spendings.css:170`) re-implements the card recipe in CSS, and with *divergent* values: radius
> **16px** instead of `--r-lg` 14px, and gradient alphas 0.3/0.14/0.1/0.26 against `.pfa-card`'s
> 0.32/0.14/0.1/0.28. COS-100 put that card on GlowCard; the later Dépenses rework
> (`view/SpendingDayCard.tsx`) took it back off.
>
> Consequence: **restyling every card is at least two edits** — `.pfa-card` in `chrome.css` *and*
> `.sp-day` / `.sp-day--today` in `spendings.css`. Don't trust the single-lever story until those are
> reconciled (§11).

### The rest

| Component | Import from `@components/shared/…` | What it's for |
|---|---|---|
| `DividedStrip` | `DividedStrip` | top-of-page stat strip: a `GlowCard` pane whose cells are split by hairlines. Dividers are `--line-soft` showing through a 1px grid gap, so each cell must supply its own opaque fill (`bg-card`) and padding. Pass grid tracks via `className`. |
| `IconButton` | `IconButton` | square icon-only button. `variant`: `ghost` \| `bordered` (default) \| `danger`. `size`: numeric CVA key `5`–`9` (`size={8}`, not `"8"`) — sets box + radius + icon size together, so never restyle the `<svg>` child. |
| `CardSectionHeader`, `CardTitle` | `CardSectionHeader` | card header row: `title` left, `meta` (muted) or `action` right. `action` wins if both are passed. `CardTitle` alone for bespoke header layouts. |
| `Overline`, `overlineClass` | `Overline` | uppercase eyebrow label. Use the exported class string when the element must be semantic (e.g. `<label htmlFor>`). |
| `EmptyState` | `EmptyState` | centered "Aucune donnée" placeholder inside a card. |
| `StatTile` | `StatTile` | `label` + `value` + optional `sub`. Compose `MoneyAmount` into `value`; surface via `className`. |
| `MoneyAmount` | `MoneyAmount` | money figure with de-emphasised decimals: `1 234` + `,50 €`. `unit` defaults to `" €"`. |
| `MeterBar` | `MeterBar` | horizontal meter. `value` = 0–100 percentage, `height` = **required, raw px number**. `fill` defaults to `var(--bar-fill)`. Single-fill only. |
| `LegendItem` | `LegendItem` | one chart-legend entry: `swatch` + children. Doesn't style the swatch (fills vary). |
| `FilterChip` | `FilterChip` | toggle filter chip. `active` required; `accent`: `"accent"` \| `"exc"`. `accentColor` (a hex) overrides with inline per-category colour. |
| `FieldShell` | `FieldShell` | form field wrapper: label + control + optional `error`. |
| `TextInput` | `TextInput` | shadcn `Input` on our field treatment. |
| `Dropzone` | `Dropzone` | headless file dropzone (a `<label>` + hidden input). Children are `pointer-events-none`; validation is the caller's job in `onFile`. |
| `comboboxTriggerClass(open)` | `comboboxTriggerClass` | shared class for the category combobox trigger. |
| `ConfirmDeleteDialog` | `ConfirmDeleteDialog` (default) | the delete-confirmation modal. Use this rather than hand-rolling an AlertDialog. |

### Buttons

`<Button>` from `@components/ui/button`. Beyond the shadcn defaults:

- **`variant="primary"`** — the hero CTA: green→blue gradient, `shadow-primary`. One per screen.
- **`variant="muted"`** — the cancel/secondary companion. Use this instead of hand-rolling
  `variant="outline"` plus overrides.
- **`variant="destructive"`** — sits on the danger tokens.

---

## 8. Category colours

Categories are user-coloured, so their colour can't be a token. The system is hue-only:
`oklch(0.80 0.09 <hue>)` over 12 palette hues, stored as hex by the backend.

From `@components/categories/helpers/categoryColors`: `CATEGORY_FALLBACK` (`#94a3b8`, the neutral
used when a category has no colour) · `PALETTE_HUES` (the 12 hues) · `catColorOklch(hue)` ·
`paletteHex()` (client-only — needs a canvas; returns greys under SSR) · `cssColorToHex(css)`.

Render with `<CategoryTag>` (pill) or `<CategoryColorDot>` (swatch) — both fall back to
`CATEGORY_FALLBACK` and apply colour inline, so `className` can't override the colour.

---

## 9. Numbers and money

`@lib/format` is the **chokepoint** for amount formatting — locale is hardcoded `fr-FR`, EUR only.
Multi-currency/i18n is explicitly deferred; when it returns, this is where most of it lands.

> It is not quite the *only* site: `kFormat` in `StatMiniChart` hardcodes `fr-FR` for compact "1,2k"
> axis labels, a case `format.ts` has no helper for. An i18n pass scoped to `format.ts` alone would
> silently miss the sparkline axes.

| Function | Output |
|---|---|
| `euro(n)` | `"1 234,50"` — always 2 decimals |
| `euro0(n)` | `"1 235"` — rounded, no decimals |
| `pct1(n)` | `"12,3"` — 1 decimal, no `%` sign |
| `splitAmount(n)` | `{ int: "1 234", dec: "50" }` — powers `MoneyAmount` |

None of them append `€` — the unit comes from `MoneyAmount`'s `unit` prop or the call site. The
`fr-FR` thousands separator is a **narrow no-break space (U+202F)**, not ASCII — relevant for tests
and clipboard/CSV comparisons.

---

## 10. Deliberate exceptions

These are decided, not forgotten. Don't "fix" them:

- **Auth keeps its teal accent family** — hue 165 link, 175 focus, **185/150** halo (two stacked
  radial gradients), **148→200** tab underline (a gradient, not a flat 200). It's tuned to
  `AuthCard`'s gradient, not to the app accent. Rationale lives in
  `shared/sharedLoginForm/authInputClass.ts`. Do **not** normalise it to `--accent-strong`.
  **Especially hue 148**: `oklch(0.84 0.14 148)` at `AuthHeader.tsx:54` is character-for-character
  identical to `--accent-strong`, so it looks exactly like an un-tokenised literal begging to be
  cleaned up. It isn't — it's the warm end of the underline's deliberate 148→200 sweep, and
  tokenising it flattens the gradient.
- **`#b3ada4`** in `InvoiceModal` — the paper stock of a printed receipt.
- **Contrast helpers** (`adjustColor`, `adjustFontColor`, `common/Category.tsx`) compute black/white
  against a dynamic category colour. Arithmetic, not palette.
- **`FALLBACK_COLOR` (`#94a3b8`) is duplicated in `lib/dataviz/adapters.ts`** rather than importing
  `CATEGORY_FALLBACK` — `lib/ → components/` would invert the layering.
- **Structural dimensions stay arbitrary**: `max-w-[480px]`, `w-[400px]`, `min-h-[9px]`,
  `size-[15px]`, `blur-[20px]`, `ring-[3px]`, AuthCard's nested `rounded-[26px]`/`rounded-[25px]`
  (the 1px gradient-border trick). These are geometry, not design tokens. ~50 remain in our code and
  ~11 in `ui/` — that's expected.
- **Radix vars** (`--radix-*`) and dynamic category colours (`${accent}22`) are inherently runtime.

---

## 11. Known rough edges

Honest list — worth knowing before you trip on them:

1. **The two radius scales** (§5). `--r-md` 10px vs `rounded-md` 8px, `--r-lg` 14px vs `rounded-lg`
   10px. Same names, different values, different layers. The real fix is reconciling them into one
   scale; nobody has.
2. **`StatisticsHeatmap` has two near-twin colour ramps** (`CELL_BG` / `DIST_BG`, alphas 0.4/0.6/0.8
   vs 0.45/0.7/0.85). Almost certainly noise rather than intent, but tokenising it changes a chart's
   rendering, so it was left alone.
3. **Focus rings and accent glows are still inline** — a `0 0 0 3px` ring is repeated rather than
   tokenised. Deliberate for now (they're not depth), but it's a candidate scale.
4. **The Dépenses day card broke back out of `GlowCard`.** `.sp-day` (`spendings.css:170`) duplicates
   the `.pfa-card` recipe with drifted values (16px radius vs 14px; alphas 0.3/0.26 vs 0.32/0.28).
   COS-100 unified it; the later Dépenses rework re-implemented it in CSS. So the card gradient and
   contrast rework — still on the table — is **two** rules, not one, and the two are already out of
   sync. Reconciling `.sp-day` back onto `GlowCard` is the prerequisite.
5. **Three fonts are downloaded and never used.** `globals.css` opens with a Google Fonts `@import`
   for **Poppins, Smooch Sans and Ubuntu**, and `typography.css` declares `--font-poppins` /
   `--font-smooch` / `--font-ubuntu` — but `src` contains **zero** references to any of them (the app
   runs entirely on Geist via `next/font`). So every page load pays a render-blocking request to
   `fonts.googleapis.com` for three unused families. Leftovers from the pre-Geist design. Deleting
   the `@import` and the three tokens is safe and is a real performance win; it just hasn't been
   ticketed.
6. **No z-index tokens** (§6b). A real seven-rung ladder exists as bare literals in four files, with
   30 doubly assigned. Add a rung by reading the table and hoping.

---

## 12. Adding UI — the checklist

1. Does a primitive already exist (§7)? Use it. If a pattern repeats twice, extract it.
2. Colour from the palette (§3) — never a raw hex or a Tailwind palette name.
3. Type from the scale (§4); every number gets `.num`.
4. Radius from `rounded-*` (§5); spacing from the numbered scale.
5. Depth from `shadow-*` (§6).
6. Cards go through `GlowCard`, layout classes only.
7. Real design decision with no token? Add the token — in the right `styles/tokens/*.css` partial.
8. Before finishing: `grep -rE '\[[0-9.]+px\]|#[0-9a-f]{6}'` over your files — anything left should be
   structural geometry (§10), not styling.

Verify with `pnpm exec tsc --noEmit` and `pnpm exec biome check ./src`.
Biome is the linter/formatter (not ESLint), `lineWidth` 120. Never run Biome over `styles/` — it's CSS.

---

## 13. Claude Design (`pnpm ds:prepare`)

This design system is also published to **Claude Design** so that new PFA screens designed there are
built from these real components and tokens, instead of the frozen 2026 mockups in
`design_handoff_pfa/` that the code has long since diverged from.

Project: https://claude.ai/design/p/aba2a406-a3d0-41e5-ab59-3481c4a782ba (tab **Design systems**).
To use it: in the Claude Design composer, pick "PFA DS" in the **Design system** dropdown.

**You never run `ds:prepare` by hand.** To re-publish after changing components or tokens, open Claude
Code in this repo and run `/design-sync` — it does the rest.

`ds:prepare` exists because pfa is an app, not a published component library: it has no `dist/` and
`noEmit: true`, so the two things the publisher needs don't exist. The script manufactures both from
this source — a `.d.ts` tree (the API contract the design agent codes against) and a compiled,
dark-by-default stylesheet. It's wired as the publisher's `buildCmd`, which is what actually calls it.

### Adding a token? Add it to the safelist too

The published bundle ships **static, pre-compiled CSS**. Tailwind only emits a class it has *seen*, so
a token family the app doesn't already use resolves to **nothing** in Claude Design — silently, with no
error, the design just renders unstyled. So when you add a family to `tokens/colors.css` (§1 says tokens
are cheap — keep making them), mirror it in the `@source inline(...)` block of
`front/.design-sync/ds-styles.src.css`. Same for a new spacing/sizing step.

Running `/design-sync` will normally catch this (it's the first rule in `NOTES.md`), but it's a
one-line edit and cheaper to do while you're already in the tokens file.

Everything else lives in `front/.design-sync/` — **read `NOTES.md` there before touching any of it.**
Several of those choices look wrong and are load-bearing (relative imports in `ds-entry.tsx`, an
unlayered `html body` rule, the `@source inline` safelists); each one failed *silently* when absent.
