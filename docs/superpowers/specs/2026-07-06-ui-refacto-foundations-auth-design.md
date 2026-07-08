# UI Refacto — Phase 0 (Foundations) + Phase 1 (Auth suite) — Design

**Date:** 2026-07-06
**Branch:** `ui-refacto`
**Scope of this spec:** the design-system foundations that the whole refactor sits on, and the first screen block — the auth suite (Login redesign, new Signup, new About), plus a light pass on Forgot-password since it shares the shell.

---

## 0. Context & overall roadmap

`pfa` is being re-skinned from a full design handoff (`design_handoff_pfa/`) that introduces a new dark visual language (oklch tokens in `pfa.css` + `pfa-glow.css`, Geist / Geist Mono, signature "glow" gradient borders, gradient primary buttons) and **many new features** that mostly need **mock data** at first (dashboard insights, projections, weekly cap, exceptionals-as-entity, full annual statistics, receipts, category usage counters).

The refactor proceeds **screen-block by screen-block**, each with its own spec → plan → implementation and a sign-off gate:

1. **Phase 0 — Foundations** (this spec): tokens, fonts, `<Logo>`, primary gradient button.
2. **Phase 1 — Auth suite** (this spec): Login / Signup / About (+ Forgot-password) on a dedicated tabbed shell.
3. **Phase 2** — App header (redesigned NavBar: nav + period selector + user menu + mobile drawer) + generic glow `<Card>` + first private screen (Catégories).
4. **Phase 3 → 6** — Dépenses → Exceptionnels → Dashboard → Statistiques (mock for new features, keep real data where it exists).
5. **Phase 7** — Mobile passes + calendar / period pickers.

Confirmed decisions (from brainstorming):
- **Token strategy:** remap shadcn's semantic tokens onto the pfa oklch palette (one source of truth); shadcn components inherit the new look.
- **Start block:** the auth suite, after foundations.
- **App header** (redesigned NavBar): deferred to **Phase 2**. The current NavBar keeps working as-is on private pages through Phase 1.
- **Signup fields:** email + password + **confirm-password** (client-side only; nothing new sent to the API).
- **Cadence:** short spec + sign-off per phase.

---

## 1. Two headers, not one (clarification)

Today a single component, `src/components/shared/navBar/NavBar.tsx`, is the app-wide header and swaps its contents by auth state (logged-out → Login/Signup/About links; logged-in → nav + date picker + user menu). The new design splits this into **two distinct headers**:

- **Auth header** (login / signup / about) — the light "tabs" bar (brand + `Login / Signup / À propos`). **Built in Phase 1.**
- **App header** (everything else, logged-in) — full nav + period selector + user menu + mobile drawer. **Redesigned in Phase 2.**

In Phase 1, public routes stop using `NavBar` and use the new auth shell instead. `NavBar` remains untouched for the private layout.

---

## 2. Phase 0 — Foundations

### 2.1 Design tokens (`styles/globals.css`, under `.dark`)

The app is dark-only (`<html lang="fr" class="dark">`), so all values live under `.dark`. The **`pfa-glow.css` overrides are baked in** (per the handoff, that's the version that "makes faith" when a page loads both stylesheets).

**Approach:** bring in the full pfa palette and **remap shadcn's semantic tokens onto it**, so existing shadcn components and any page using semantic classes (`bg-background`, `bg-card`, `text-muted-foreground`, `border`, …) shift to the new look automatically.

**Name-collision to respect:** shadcn's `--accent` / `--accent-foreground` are a **surface-hover** token (dropdown/ghost hover), *not* the brand color. The pfa brand green must map to **`--primary`**, and shadcn `--accent` maps to the pfa **hover surface** (`--bg-hover`). Do **not** point shadcn `--accent` at the brand green.

Remap (values from `pfa.css` + `pfa-glow.css`):

| shadcn token | pfa source | oklch |
|---|---|---|
| `--background` | `--bg` | `0.14 0.042 234` |
| `--foreground` | `--ink` | `0.975 0.004 250` |
| `--card`, `--popover` | `--bg-elev` (glow) | `0.185 0.006 250` |
| `--card-foreground`, `--popover-foreground` | `--ink` | `0.975 0.004 250` |
| `--primary` | `--accent` (brand green) | `0.84 0.14 148` |
| `--primary-foreground` | dark ink on accent | `0.18 0.01 148` |
| `--secondary`, `--muted` | `--bg-hi` (glow) | `0.215 0.007 250` |
| `--secondary-foreground` | `--ink` | `0.975 0.004 250` |
| `--muted-foreground` | `--ink-3` (glow) | `0.62 0.006 250` |
| `--accent` (surface hover) | `--bg-hover` | `0.22 0.006 250` |
| `--accent-foreground` | `--ink` | `0.975 0.004 250` |
| `--destructive` | `--neg` | `0.72 0.17 25` |
| `--destructive-foreground` | dark ink | `0.15 0.01 25` |
| `--border`, `--input`-border | `--line` (glow) | `0.27 0.008 250` |
| `--input` (field bg) | `--bg` | `0.14 0.042 234` |
| `--ring` | `--accent-d` | `0.55 0.10 148` |

**pfa-specific tokens** (not in shadcn's vocabulary) added under a `--pfa-*` namespace and exposed to Tailwind v4 via `@theme inline` (→ utilities like `text-ink-3`, `bg-exc`, `border-elec`):
- Full ink ramp: `--ink-2 0.78`, `--ink-3 0.62`, `--ink-4 0.47`, `--ink-5 0.30`.
- `--accent-d 0.55 0.10 148`, `--accent-bg`, `--neg-bg`, `--exc 0.70 0.13 240` + `--exc-bg`, `--elec 0.72 0.15 230`.
- Category palette — the 12 selection hues `[5,25,60,80,110,140,175,210,250,290,320,350]` at `oklch(0.80 0.09 <hue>)` (helper for arbitrary hues later).
- Radii: `--r-xs 4 / --r-sm 6 / --r-md 10 / --r-lg 14 / --r-xl 18`.

`@theme inline` gains matching `--color-*` (and `--radius-*`) entries so the new utilities exist. Existing shadcn `@theme inline` mappings stay.

**Note on migration blast-radius:** flipping these globals shifts the palette on the *still-old* private pages too. That's expected and acceptable on this branch — those pages remain usable and get their real redesign in later phases. Hard-coded colors in old pages (`bg-[#0c0c0c]`, `from-[#2a2d3a]`) are unaffected until migrated.

### 2.2 Fonts

Load **Geist** and **Geist Mono** via `next/font/google` (both confirmed available; **no new dependency**, no CDN). Configure in `src/app/layout.tsx`, expose as `--font-geist-sans` / `--font-geist-mono`, and map Tailwind `--font-sans` / `--font-mono` + the body default to Geist. Add a `.num` / `tabular-nums` utility for "every meaningful number is Geist Mono" (used heavily from Phase 2 on).

Legacy font vars (Poppins/Smooch/Ubuntu) stay defined for now (harmless) and are removed once no screen references them. Base body font switches to Geist globally.

### 2.3 Shared primitives

- **`<Logo>`** — new `src/components/shared/brand/Logo.tsx`. The pfa SVG mark (rounded tile + cyan→green "spending curve" stroke). Props: `size` (default 26; 58 for the login card), `glow` (adds the blurred pulsed under-stroke used on the large login variant). Gradient `<defs>` IDs made unique per instance (`useId`) so the small header logo and the large card logo can coexist.
- **`<Button variant="primary">`** — extend `src/components/ui/button.tsx` cva with the green→cyan gradient (`.btn-primary` from `pfa-glow.css`: gradient bg, `oklch(0.15 0.02 180)` text, glow shadow, `:active` translateY(1px)). The auth submit uses it. Existing variants untouched.

**Deferred to Phase 2** (not needed by auth, so not built now): the generic glow `<Card>` surface and the redesigned app header / mobile drawer / user menu.

---

## 3. Phase 1 — Auth suite

All auth routes live under `src/app/(public)/` and share a new tabbed shell.

### 3.1 Auth shell (new components under `src/components/auth/`)

- **`AuthShell`** — page frame: fixed grain background layer (the `feTurbulence` data-URI from `Login 2026.html`, `opacity ~0.28`), `AuthHeader`, a centered `login-stage`, and the version footer `pfa · 1991computer.com` (Geist Mono, `--ink-4`).
- **`AuthHeader`** (client) — brand (`<Logo size={26}/>` + `pfa`) + tabs `Login / Signup / À propos`. Active tab from `usePathname` (underline = green→cyan gradient bar). Tabs are `next/link` to `/login`, `/signup`, `/about`.
- **`AuthCard`** — the glass card: `card-halo` (radial blurred glow behind) → `card-border` (1px gradient-border wrapper, radius 26px) → `login-card` (`backdrop-blur(24px)`, gradient glass fill, top sheen line, 400px / `max-width: calc(100vw - 48px)`). Renders `children`.
- **`AuthBrand`** — `<Logo size={58} glow/>` + `<h1>` title + `<p>` subtitle. Props: `title`, `subtitle?`.

`src/app/(public)/layout.tsx` is rewritten to: `AuthProvider` (kept — still needed) → `AuthShell` → `{children}`. **`NavBar` is removed from the public layout.**

### 3.2 Shared auth form (`SharedLoginForm` refactor)

Keep the react-hook-form + zod logic and the `onSubmit(values)` contract; change presentation and add confirm-password:
- Remove the internal "Personal Finance Assistant" heading (now owned by `AuthBrand`).
- Restyle fields to the mockup `.input` (dark translucent bg `oklch(0.12 0.008 250/0.75)`, `--line` border, focus → teal border + `0 0 0 3px` teal ring). Keep the password show/hide eye.
- Submit → `<Button variant="primary" size="lg">` full-width with the trailing arrow icon.
- **New prop `displayConfirmPasswordField`** → renders a second password field; zod `.refine` enforces `password === confirmPassword` ("Les mots de passe ne correspondent pas"). Confirm value is **not** forwarded to services.
- `SharedLoginFormProps` / `LoginValues` extended with the confirm flag/field. Existing callers (login, forgot) keep working unchanged.

### 3.3 Pages

- **Login** (`(public)/login/page.tsx` + `LoginFormClient`): `AuthCard` → `AuthBrand("Personal Finance Assistant", "Chaque euro à sa place.")` → form (email + password) via `useLoginService` + `setCredentials` (unchanged) → "Mot de passe oublié ?" → `/forgotPassword` → footer "Pas encore de compte ? `Créer un compte`" → `/signup`. Server-side session redirect to dashboard stays.
- **Signup** (`(public)/signup/page.tsx`): `AuthCard` → `AuthBrand` (signup copy) → form (email + password + **confirm-password**) via `useSignupService` + `setCredentials` (unchanged) → footer "Déjà un compte ? `Se connecter`" → `/login`.
- **About** (`(public)/about/page.tsx`): `AuthCard` → `AuthBrand("À propos")` → the existing legal text (OVH SAS · 2 rue Kellermann, 59100 Roubaix · APE 2620Z · TVA FR 22 424 761 419), restyled with the new tokens.
- **Forgot-password** (`(public)/forgotPassword/page.tsx`): `AuthCard` → brand + email-only form (unchanged `useResetPasswordService`) + a "← Retour à la connexion" link. Light touch so it isn't left visually broken.

The old `.auth-card-gradient` helper class is removed from `globals.css` once no page references it.

---

## 4. Out of scope (this phase)

Private screens; the redesigned app header / mobile drawer / user menu (Phase 2); generic glow `<Card>` (Phase 2); any new-feature mock data; calendars / period pickers; `changepassword` (private). No API, auth, routing, or data-layer logic changes — Phase 1 is presentation only.

---

## 5. Risks & mitigations

1. **Token name collision** (shadcn `--accent` surface vs pfa brand green) → brand → `--primary`; shadcn `--accent` → hover surface. Verified in §2.1.
2. **Global palette shift on old private pages** → expected/acceptable on-branch; verify pages still load and are usable, not pixel-perfect.
3. **oklch in SVG gradient stops** → supported by the app's modern-browser target; acceptable.
4. **`next/font` config** → must be set in a server layout (`app/layout.tsx`) and applied via variable classes on `<html>`/`<body>`.

---

## 6. Verification (evidence before "done")

Via the preview/dev-server tooling:
- `/login`, `/signup`, `/about`, `/forgotPassword` render with the new shell (grain bg, tabbed header, haloed glass card, gradient submit) — compare against `design_handoff_pfa/screenshots/Login.png`.
- Console + network clean on each page.
- **Login** still POSTs `/users`; **Signup** still POSTs `/users/add`; **confirm-password** mismatch blocks submit; **Forgot** still calls reset.
- Active-tab state tracks the route.
- Narrow viewport (≈390px): card respects `max-width`, header tabs wrap, no horizontal scroll.
- Existing private pages still load (palette-shifted only).

---

## 7. Acceptance criteria

- [ ] pfa oklch tokens (glow variant) in `globals.css`, shadcn semantics remapped onto them, pfa-specific tokens exposed to Tailwind.
- [ ] Geist + Geist Mono via `next/font`; body defaults to Geist.
- [ ] `<Logo>` and `<Button variant="primary">` (gradient) exist and are used by the auth suite.
- [ ] Auth shell (grain bg + tabbed header + halo/glass card + version footer) wraps all public routes; `NavBar` no longer renders on public routes.
- [ ] Login redesigned; Signup (with confirm-password) and About created on the shell; Forgot-password fits the shell.
- [ ] Login / Signup / Forgot service calls unchanged and working; confirm-password validated client-side only.
- [ ] Verified in the running app with the checks in §6.
