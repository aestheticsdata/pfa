# UI Refacto — Phase 3 (Dépenses) — Design

**Date:** 2026-07-06 · **Branch:** `ui-refacto`

## Context / key finding

The current `/dashboard` route (nav label "Dépenses") renders **two** things via `Spendings.tsx`:
1. `SpendingDashboard` — the **monthly** block: initial salary, weekly ceiling, category charts, and the **fixed-expenses / recurrings** panel.
2. The **weekly** day-cards timeline (`SpendingDayItem` grid) + quick-add modal.

The new design splits these into two pages: **Dashboard** (monthly, redesigned in Phase 5) and **Dépenses** (weekly, redesigned now).

Almost everything is already REAL (wired to the NestJS API): spendings CRUD (`/spendings`), categories (`/categories`, on-the-fly creation client-side), recurrings (`/recurrings`), receipts/invoices (`POST /spendings/upload`, 32 MB, jpg/png/webp/gif), sort, weekly/monthly stats (`/weeklystats`, `/monthlystats`), category charts (`/spendings/charts`), dashboard salary/ceiling (`/dashboard`). So Phase 3 is mostly a faithful **re-skin** plus a few client-side additions.

**Decisions (user):** split the routes now; Export button = **mock** (toast "à venir"); the week-picker redesign stays **Phase 7** (keep the existing `DatePickerWrapper`).

**Note — `SpendingDayItem` is shared** by the timeline (spendings) and the recurrings panel (`recurringType`). To avoid breaking the monthly view, the redesign builds **new** day-card components for Dépenses and leaves `SpendingDayItem` for the recurrings/overview usage.

## Routing split

- **Dépenses (weekly)** stays at **`/dashboard`** (all week/`?date=` plumbing in `src/helpers/dateRoute.ts` unchanged). Renders the new weekly experience only.
- **Dashboard (monthly)** = new route **`/overview`**, renders the existing `SpendingDashboard` (old style) until Phase 5.
- Nav gains a **"Dashboard"** item (→ `/overview`), placed first. Routes are internal (users navigate by label) and can be renamed with redirects in Phase 5.

## Sub-phases

- **3a — Structural split (this step):** extract the store-init into a hook (`useEnsureWeekRange`); `/dashboard` → new `SpendingView` (the day-cards section, unchanged styling for now); new `/overview` page → `SpendingDashboard`; add the "Dashboard" nav route. Pure refactor — verify it compiles and both routes load (user, logged-in).
- **3b — Dépenses visual redesign:** toolbar (search + mock export), 4-cell weekly summary, per-category breakdown pane, category filter chips (global), and the **new day-cards timeline** (glow cards, `--elec` "today" accent, per-day sort, transaction rows with hover actions + **inline delete confirmation**, day-budget footer, "+ ajouter" row). Reuses existing hooks/data.
- **3c — Modals:** redesign the add/edit spending modal (date stepper, label suggestions, big amount, category combobox, "Récurrente"/"Reçu" toggles + inline receipt attach) and the receipt/invoice modal + full-screen lightbox. Wires to existing `SpendingModal` / `InvoiceModal` logic.

## Real vs mock
Real: everything above. Mock (clearly marked): cross-week deltas ("vs semaine dernière"), category trend arrows (need prior-week data), and the Export button.

## Verification
The private area needs a logged-in session (API + creds) which the agent lacks, so Phase 3 is verified by: type-check + lint clean, private routes compile with no server error, and **the user validates the logged-in rendering/behavior**.
