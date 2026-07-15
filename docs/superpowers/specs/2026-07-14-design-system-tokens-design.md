# Design System — Token Foundation + Per-Page Adoption

**Date:** 2026-07-14
**Epic:** COS-43 (foundation) → COS-64, 65, 66, 67, 68, 69, 70 (per-page adoption)
**Scope owner:** solo dev, sequential branch/PR merges, dark-only app.

---

## 1. Problem

All CSS lives in one 1699-line `front/styles/globals.css`. Across `front/src` there are
**~469 arbitrary Tailwind values** (`p-[22px]`, `text-[13px]`, `rounded-[3px]`, `tracking-[0.08em]`,
inline `oklch(...)`) spread over **~75 files**. There is no spacing scale, no type scale, an
incomplete radius scale, and repeated inline colors. Widget surfaces are also inconsistent
(two families: `--bg` vs `--bg-elev`).

The goal is a real, small, coherent design-system foundation that the page tickets then adopt
with **no visible change** to the UI.

## 2. Guiding principle (decided with the user)

> **Tailwind-first. Preserve the existing look. Best compromise, not pixel-perfect. Keep the
> custom-token set small and manageable.**

Concretely: map each arbitrary value to the **nearest Tailwind-native step**; a drift of ~1–2px
is acceptable and invisible. Mint a **custom token only** where Tailwind has no close-enough step
(brand colors, sub-12px type, two off-scale radii).

Reference — Tailwind v4.1 native defaults (verified in `tailwindcss/theme.css`):
- **spacing:** `--spacing: 0.25rem` → dynamic 4px grid (`p-4`=16, `p-1.5`=6, `p-5.5`=22 …).
- **radius:** xs=2 · sm=4 · md=6 · lg=8 · xl=12 · 2xl=16 · 3xl=24.
- **text:** xs=12 · sm=14 · base=16 · lg=18 · xl=20 · 2xl=24 · 3xl=30 · 4xl=36 · 5xl=48 …

## 3. Token decisions

### 3.1 Spacing — 100% Tailwind native, **0 custom**
The dynamic 4px grid covers everything. Adoption rule: snap to the nearest **whole or half**
step (`p-6`, `p-4.5`), never quarter steps. Exact hits are common (`22px`=`p-5.5`, `18px`=`p-4.5`,
`6px`=`p-1.5`, `30px`=`p-7.5`). Values between steps drift ≤2px.

### 3.2 Radius — Tailwind native + **2 custom**
- Exact native matches: `2/4/6/8/16/24px` → `rounded-xs/sm/md/lg/2xl/3xl`.
- Off-scale but heavily used: **10px** (×8) and **14px** (×4) → keep as **two custom tokens**
  (`--radius-10`, `--radius-14` → `rounded-10`, `rounded-14`; final names set in the plan).
- Retire the legacy `--r-xs..xl` (4/6/10/14/18): 4/6 are redundant with native; 10/14 become the
  two kept tokens; 18 is unused-in-practice → drop or snap. Page tickets that reference `--r-lg`
  map to the 14px token.

### 3.3 Typography — Tailwind native + **2 custom (sub-12px)**
- `≥12px` uses native: 12=`xs`, 14=`sm`, 16=`base`, 18=`lg`, 20=`xl`, 24=`2xl`, 30=`3xl`, 36=`4xl`, 48≈`5xl`.
- Tailwind has nothing below 12px, but compact labels use **9px** and **11px** a lot → two custom
  tokens `--text-3xs` (9px) and `--text-2xs` (11px).
- In-between sizes snap ≤1px: 10→`2xs`(11), 13→`xs`(12) or `sm`(14), 15→`sm`(14), fractional
  10.5/12.5/14.5→nearest. Big titles 32/34/40/46/56 → `4xl`(36)/`5xl`(48).
- `tracking-*`: keep the handful of `tracking-[…em]` as native arbitrary tracking **or** a tiny set
  of tokens (`--tracking-tight/wide`); decided in the plan (low churn, ~4 distinct values).

### 3.4 Colors — reuse & extend the existing token set, **no new system**
Keep `--ink*`, `--bg*`, `--accent-strong`, `--accent-d`, `--neg`, `--exc`, `--elec`, `--line*`, …
Fold the **repeated inline `oklch(...)`** (accent green `0.84 0.14 148`, danger red `0.55 0.15 25`,
blue, shadows `oklch(0 0 0/…)`) into named tokens so pages can drop the inline values. Add missing
semantics surfaced by tickets: an **on-accent text** token (`text-[oklch(0.15_0.02_180)]`) and an
**elevation/shadow** token (`shadow-[0_10px_30px_oklch(0_0_0/0.35)]`).
Genuine one-offs stay hardcoded and commented: invoice tan `#b3ada4`, data-driven category colors
(`item.categoryColor`, `${accent}22`), Radix vars (`w-[--radix-popover-trigger-width]`),
structural viewport dims (`max-w-[480px]`, `max-h-[92vh]`).

### 3.5 Surface (COS-43 Part A) — the one intentional visual change
Keep the current **two-tier** look (dark page vs. slightly lighter card/widget). Then:
1. **Consistency:** move the two stray widgets on `--bg` (`SpendingSummary` cells,
   `InsightsRibbon`) onto the elevated surface so all widgets share one background.
2. **Lighten:** raise the elevated surface lightness a notch (`~0.185`→`~0.205` L; exact value
   tuned by the user in QA). This is the ticket's literal goal ("éclaircir le fond des widgets").
3. **De-hardcode login:** point `AuthCard.tsx` background at the surface token instead of its
   inline oklch gradient.

## 4. `globals.css` split (COS-43 Part B)

`globals.css` becomes a thin entry point. New layout under `front/styles/`:

```
globals.css              @import 'tailwindcss'; @custom-variant dark; @import partials (ordered)
tokens/colors.css        :root(dead light) + .dark palette + shadcn remap + @theme inline color utils
tokens/radius.css        --radius-10/--radius-14 + @theme radius utils
tokens/typography.css    font @imports, --font-*, --text-2xs/3xs, .num
base.css                 @layer base (reset, border-color pin, autofill fix)
animations.css           keyframes (pfa-logo-pulse, pfa-donut-grow, pfa-draw-x) + .pfa-anim-*
components/chrome.css     .pfa-hdr/.pfa-card*/.pfa-drawer/.pfa-scrim/.auth-grain/scrollbars
components/daypicker.css  .DayPicker*
components/spendings.css  .sp-*
components/exceptionals.css .exc-*
components/category-detail.css .catd-*
```

**Tailwind v4 ordering is load-bearing:** `@import 'tailwindcss'` first, `@custom-variant dark`
before use, `@theme` / `@theme inline` blocks must remain compiler-visible. Verify build + visual
render are unchanged after the split (independent of the surface change in §3.5).

## 5. Per-page adoption playbook (COS-64→70)

Every page ticket follows the same recipe, so they're fast and consistent:

1. Branch first (`cosmokaat/cos-<n>-...`), Linear → **In Progress**.
2. Inventory the page's `-[…]` arbitrary values + inline `oklch` (grep the ticket's file list).
3. Replace each with the token/native utility per §3, applying the snap rules. **No DOM changes,
   no behavior changes.**
4. Keep documented one-offs as-is.
5. Verify: `tsc` + `biome lint` clean, build OK. Linear → **Verify**; the user QAs visually.
6. Commit **only on explicit user OK**; open PR; merge; move to next page.

Page targets (route → component dirs), roughly ordered by density:
- **COS-65 Dépenses** — `spendings/view`, `spendings/common/spendingModal`, `spendings/invoiceModal` (~70 values, 7 oklch — densest).
- **COS-64 Dashboard** — `dashboard/*`.
- **COS-68 Exceptionnels** — `exceptionals/*` + `.exc-*` CSS block (~30 values).
- **COS-66 Statistiques** — `statistics/*`.
- **COS-67 Catégories** — `categories/*` + `.catd-*` CSS block.
- **COS-69 Auth** — login/signup/forgot/reset (shares the surface token from §3.5).
- **COS-70 About** — `(public)/about/page.tsx` (self-contained).

## 6. Execution order & workflow

1. **COS-43 first, standalone branch+PR.** Foundation for all 7; must be solid and reviewed alone.
   Sub-sequence inside COS-43: (a) split `globals.css` with **zero value changes** (pure move,
   verify identical render) → (b) add the token scales (§3.1–3.4) → (c) Part-A surface change (§3.5).
   Splitting (a) and (c) into separate commits keeps the visual change isolated and easy to QA.
2. **Then COS-64→70, one branch+PR each, sequentially** (solo/sequential-merge workflow), using §5.

Constraints (standing user rules): work in the **main repo** (no worktrees), **branch before any
edit**, **never commit without explicit OK**, English identifiers only, path aliases only
(`@components/...`), Biome (no `eslint-disable`), no manual `useMemo`/`useCallback`, don't launch
the front dev server (the user QAs in their own browser).

## 7. Verification

- **Build:** Tailwind compiles, no missing token/utility after the split (`pnpm build` / typecheck).
- **Lint/types:** `tsc` + `biome lint` clean.
- **Visual:** user QA in their browser. COS-43 checkpoints: dashboard cards, 4 Dépenses widgets,
  InsightsRibbon, day-cards, category modal, DayPicker, login. Page tickets: the page renders
  pixel-identical (except COS-43's intended surface lightening).

## 8. Out of scope

- Rewriting component `className`s is **not** in COS-43 (only token definition + split + §3.5).
- No new features, no DOM restructuring, no Figma-driven changes.
- Light theme is dead (app is `dark`-only on `<html>`); don't invest in `:root` light values.
