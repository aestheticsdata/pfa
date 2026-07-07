# REFACTO UI — Notes de reprise

> Doc de handoff pour le gros refacto UI de **pfa** (front Next.js). À lire en premier pour reprendre le fil. Branche : **`ui-refacto`** (repo principal `/Users/cosmokaat/dev/pfa`, jamais un worktree).

---

## 1. Objectif

Re-skin complet du front à partir du handoff de design **`design_handoff_pfa/`** :
- `README.md` — cahier des charges (⚠️ pas toujours à jour, l'utilisateur a modifié les screenshots).
- `designs/*.html` — maquettes HTML/CSS/JS vanilla (références de rendu + comportement, **pas** du code de prod).
- `designs/assets/` — `pfa.css` + `pfa-glow.css` (design system, source de vérité tokens), + JS de démo (formes de données).
- `screenshots/` — rendus PNG.

Principe : **reproduction fidèle** (pas pixel-perfect), réimplémentation en **React + shadcn**. Features nouvelles sans back = **données mock** marquées `// MOCK`.

## 2. Stack

Next.js 16 · React 19 · Tailwind v4 · shadcn (new-york) · zustand · react-query · recharts · react-day-picker v7 · zod · react-hook-form · sonner. Thème **sombre exclusif** (`<html class="dark">`). Back = NestJS (dev sur `localhost:6100`).

## 3. Décisions actées (via l'utilisateur)

- **Tokens** : palette oklch pfa = source unique dans `styles/globals.css`, les tokens sémantiques shadcn sont **remappés** dessus. Le vert de marque = `--primary` / `--accent-strong` ; ⚠️ le `--accent` de shadcn reste le **survol** (`--bg-hover`), PAS le vert.
- **Polices** : Geist + Geist Mono via `next/font` (pas de CDN). Base = Geist. `.num` = Geist Mono tabular (tout nombre significatif).
- **Cadence** : spec courte + validation par phase. Specs dans `docs/superpowers/specs/`.
- **Catégories** : bouton « Nouvelle catégorie » affiché mais **création mock-only** (locale, non persistée) — toujours **pas de `POST /categories`**. Édition/suppression = réelles.
- **Dépenses** : split des routes fait (voir §5). Export = **mock** (toast). Week-picker redesign = **Phase 7**.
- **En-tête d'app** (NavBar) : redessiné en Phase 2 (pas en Phase 1).
- **Signup** : email + mot de passe + **confirmation** (client-only).

## 4. Avancement (commité sur `ui-refacto`)

| Phase | Contenu | Commit |
|---|---|---|
| Spec 0+1 | doc | `6c5cc34` |
| **0** Fondations | tokens remappés, Geist, `<Logo>`, Button `primary` dégradé | `3dbb94a` |
| **1** Auth | shell à onglets (`AuthHeader`/`AuthCard`/`AuthBrand`), Login redessiné, **Signup** (+confirm), **About**, Forgot ; NavBar retiré du public | `3dbb94a` |
| **2a** Chrome app | `NavBar` → barre glow sticky (`.pfa-hdr`), `UserMenu` (avatar+dropdown), **drawer mobile** (`.pfa-drawer`+scrim), `.pfa-card`/`.pfa-card-hover` | `768cccf` |
| **2b** Catégories | grille glow, toolbar, édition nom+couleur (12 teintes pfa + picker) → réel, delete → réel, création **mock**, stats `% · N fois` **mock** | `768cccf` |
| **3a** Split routes | voir §5 (structural, pas de visuel) | `3a7064d` |
| **3b** Dépenses redesign | module **`src/components/spending/`** (identifiants EN ANGLAIS) : toolbar (search + export mock), résumé 4 cellules, pane répartition, filtres catégories globaux, **nouvelles cartes-jour** glow (classes `.sp-*`) ; tsc+eslint clean, **à valider en loggé** | _non commité_ |
| **3c** Modales | `SpendingModal` (reskin glow, date stepper, gros montant mono, combobox conservé, **toggle « Récurrente mensuelle » → réel**), `InvoiceModal` (facture : header tag/montant, stage image, drag-drop **upload immédiat**, delete) + `InvoiceImageModal` (lightbox plein écran). Logique préservée. Reviewé (workflow adversarial). tsc+eslint clean, **à valider en loggé** | _non commité_ |
| **4** Exceptionnels | re-skin de la feature existante (déjà 100% réelle) : KPI strip 4 cartes (dont **Part des dépenses** dérivée du `regularMonthlyAverage`), toolbar year-**chips** + **« Toutes les années »** (fetch year-optional) + Ajouter, groupes par mois (cartes `.exc-*`), modale reskin. CRUD/filtres/stats préservés. | `2a23973` |
| **5a** Lib data-viz | `src/components/dataviz/` (SVG custom) : `Donut`/gauge/pie, `LineChart`/sparkline, `BarChart`, `StackedBar`, `ProgressTrack` + adapters. API générique + adaptateurs projet. | `e442565` |
| **5b** Dashboard | `/overview` reconstruit sur la lib (`src/components/overview/`) : **MonthSelector** (remplace le calendrier semaine), sections réelles (hero jauge+edit salaire, répartition, plafond hebdo+edit, dépenses fixes CRUD) + mock (insights/forecast/sparkline). Ancien `SpendingDashboard` = dead code. Reviewé. | `daca890`,`649df99` |

**Vérifié navigateur** : Phase 1 (public — pas de session requise) OK sur `/login /signup /about /forgotPassword`, responsive mobile OK. Phases 2 et 3a : `tsc`+`eslint` clean, routes privées **compilent** sans erreur, mais **pas de vérif visuelle loggée possible côté agent** (voir §8).

## 5. Routing actuel (après split Phase 3a)

L'ancienne `/dashboard` combinait Dashboard mensuel + timeline Dépenses hebdo. Séparé :
- **`/dashboard`** = **Dépenses** (hebdo) → `SpendingView` (timeline cartes-jour seule). Toute la plomberie semaine/`?date=` (`src/helpers/dateRoute.ts`) reste ici, inchangée.
- **`/overview`** = **Dashboard** (mensuel) → `OverviewPageClient` → `SpendingDashboard` (salaire/plafond/graphes/**récurrents**), **style actuel**, redesign en Phase 5.
- Nav (`NavBar`) : Dashboard(`/overview`) · Dépenses(`/dashboard`) · Exceptionnels · Catégories · Statistiques.
- Hook partagé d'init du store : `useEnsureWeekRange`. `Spendings.tsx` supprimé.
- URLs internes (on navigue par libellés) — renommables proprement en Phase 5 avec redirects si besoin.

## 6. RÉEL vs MOCK (⚠️ corrige le README)

**Déjà branché sur l'API (ne PAS mocker)** : CRUD dépenses (`/spendings`), catégories (`/categories`, création à la volée client), récurrents (`/recurrings`), **reçus/factures** (`POST /spendings/upload`, 32 Mo, jpg/png/webp/gif), tri, stats hebdo/mensuelles (`/weeklystats`,`/monthlystats`), charts catégories (`/spendings/charts`), salaire/plafond (`/dashboard`).

**Mock (marquer `// MOCK`)** : création standalone de catégorie ; stats catégorie `% · N fois` (page Catégories) ; deltas « vs semaine dernière » et flèches de tendance (données cross-semaine) ; bouton Export ; **modale dépense** : suggestions de label (`spendingModal/mockSuggestions.ts`), classement « Fréquentes » (les 6 premières catégories réelles ; la *sélection* est réelle, seul le *classement* est mock), **reçu-à-la-création** (aperçu local `FileReader`, **non uploadé** au submit — `POST /spendings` ne renvoie pas d'ID ; le reçu s'ajoute après création via l'icône reçu).

## 7. Design system — où c'est

- `styles/globals.css` : tokens pfa (bloc `.dark`), remap shadcn, `@theme inline` (utilitaires `text-ink-3`, `bg-exc`, `border-line`…, fonts), + classes signature : `.pfa-hdr` (header), `.pfa-card`/`.pfa-card-hover` (cartes glow), `.pfa-drawer`/`.pfa-scrim` (drawer mobile), `.auth-grain`, `.pfa-logo-pulse`, `.num`.
- `src/components/shared/brand/Logo.tsx` : marque SVG (`size`, `glow`). IDs de dégradé **déterministes** (`pfaStrokeGlow`/`pfaStrokePlain`/`pfaTileGlow`) — surtout ne PAS repasser à `useId` (ça a causé un mismatch d'hydratation, corrigé).
- `src/components/ui/button.tsx` : variante `primary` (dégradé vert→cyan).
- Auth : `src/components/auth/` (`AuthShell` via `(public)/layout.tsx`, `AuthHeader`, `AuthCard`, `AuthBrand`). `SharedLoginForm` restylé + prop `displayConfirmPasswordField`.
- Catégories : `src/components/categories/` (`CategoriesListcontainer`, `CategoryItem`, `CategoryFormModal`, `helpers/categoryColors.ts` [conversion oklch→hex via canvas + 12 teintes], `helpers/mockCategoryStats.ts`).

## 8. Contraintes de vérification

- **Espace privé non vérifiable côté agent** : le layout `(private)` redirige vers `/login` sans session, et l'agent n'a ni l'API ni les identifiants. → Phases privées validées par : `tsc` + `eslint` + compilation des routes sans erreur, PUIS **l'utilisateur valide le rendu loggé**.
- **⚠️ Cache CSS Turbopack périmé** : après de gros ajouts dans `styles/globals.css` (ex. classes `.sp-*`/`.exc-*`), le dev server Next 16/Turbopack peut servir un **CSS périmé** (classes custom absentes → layout cassé) alors que le source est correct. Diagnostic : `@tailwindcss/postcss` sur `globals.css` émet bien les règles. **Fix côté utilisateur : `rm -rf .next` + relancer le dev.** (Pas un bug de code.)
- **Preview / node** : `.claude/launch.json` (gitignore) pointe le serveur preview sur **node 20** (`/Users/cosmokaat/.nvm/versions/node/v20.10.0/bin/node`) car le node système est 18 (< requis Next 16). L'utilisateur, lui, tourne en node 24 → lancer avec node ≥ 20.9.
- Erreurs `tsc` préexistantes (hors périmètre, ne pas corriger sauf demande) : `spendingDashboard/fixedExpenses/FixedExpensesPanel.tsx` (`invoicefile`) et `ui/form.tsx` (React UMD). Toujours filtrer ces 2 fichiers en lisant la sortie tsc.

## 9. Prochaines étapes

- **Phase 3b** ✅ **implémentée** (à valider en loggé) — redesign visuel de la page **Dépenses** dans le module **`src/components/spending/`** (⚠️ identifiants EN ANGLAIS, cf mémoire `feedback_english_identifiers`) : `SpendingView` (orchestrateur, rendu par `DashboardPageClient`), `SpendingToolbar` (search + export **mock** toast), `SpendingSummary` (4 cellules ; « vs plafond » réel = `dashboard.initialCeiling`, « vs sem. dernière » **mock** = `helpers/mockSpending.ts`), `SpendingCategoryBreakdown` (pane répartition, trend **mock**), `SpendingCategoryFilter` (chips filtre global), `SpendingDayCard` + `SpendingTxRow` (cartes-jour glow, accent `--elec`, tri via `helpers/useDaySort.ts`, actions survol reçu/éditer/**suppr. confirmation inline**, budget jour = `initialCeiling/7`). CSS signature : classes `.sp-*` dans `styles/globals.css`. `SpendingDayItem` (module `spendings/`) **NON modifié**. tsc+eslint clean. Non commité.
- **Phase 3c** ✅ **implémentée** (à valider en loggé) — modales redessinées : `SpendingModal` (reskin glow pfa, date stepper, gros montant mono, label, combobox catégorie conservé, **toggle « Récurrente mensuelle » câblé au réel** `POST /recurrings` — create-only, masque date/catégorie), `InvoiceModal` → facture (header label·tag·montant, stage image → lightbox, drag-drop **upload immédiat**, delete via AlertDialog, barre de progression) + `InvoiceImageModal` → lightbox plein écran. **Logique préservée** (mexp, zod, create-on-the-fly catégorie, itemType upload). `SpendingModal` **complété à la maquette** : suggestions de label (**mock** `mockSuggestions.ts`), chips « Fréquentes » (6 catégories réelles, sélection réelle, **classement mock**), toggle « Joindre un reçu » → attach reçu inline (aperçu `FileReader`, **visual-only / non uploadé au submit** — cf §6). Drop-zones (SpendingModal + InvoiceModal) : `[&_*]:pointer-events-none` pour éviter le flicker drag. Reviewé par 3 workflows adversariaux (findings traités : copy-button gating, hydration currentYear ailleurs, flicker drag). **Question ouverte utilisateur** : modifier `nest-api` pour que `POST /spendings` renvoie l'ID créé et câbler le reçu à la création (sinon reste mock).
- **Phase 4** ✅ **implémentée** (à valider en loggé) — re-skin de **Exceptionnels** (`/exceptionals`), feature déjà 100% réelle. Fichiers restylés dans `src/components/exceptionals/` : `ExceptionalStatsCards` (KPI strip 4 cartes ; 4e = **Part des dépenses** dérivée du `regularMonthlyAverage` réel, « — » si indispo/toutes années), `ExceptionalFilters` (year-**chips** + **« Toutes les années »** → `useExceptionals({year: undefined})` fetch tout ; filtre catégorie conservé en 2e rangée ; bouton Ajouter), `ExceptionalsList` (groupes mois → cartes bordées), `ExceptionalItem` (lignes `.exc-*`), `ExceptionalModal` (reskin pfa, date+montant, label, description, combobox). CRUD/mexp/zod/validation préservés. CSS signature : classes `.exc-*` dans `globals.css`. Reviewé (workflow adversarial ; 1 finding hydration `currentYear` → lazy `useState` init).
- **Phase 5** ✅ **implémentée** (à valider en loggé) — **5a** lib data-viz SVG custom (`src/components/dataviz/`), **5b** Dashboard `/overview` reconstruit dessus (`src/components/overview/`) : **MonthSelector** (remplace le calendrier semaine ; met le store aux bornes du mois), hero budget+jauge (edit salaire), plafond hebdo (edit plafond), répartition catégories (→ modal), dépenses fixes (CRUD) — RÉELS ; insights/forecast/sparkline = **mock** marqué. Ancien `SpendingDashboard` = **dead code** (non supprimé — proposer un commit de cleanup). Reviewé (workflows adversariaux : fix forecast mois-vu ; gridLines=1 dans la lib).
- **Phase 6** — Statistiques (`/statistics`, le plus lourd : charts recharts, heatmap [mock], comparaisons inter-années [mock]).
- **Phase 7** — passes mobile + refonte des sélecteurs de période (week-picker / day-picker, `react-day-picker`).

Ordre de référence : README §8. Spec Phase 3 : `docs/superpowers/specs/2026-07-06-ui-refacto-phase3-depenses-design.md`.

## 10. Mémoire agent (auto, persiste entre sessions)

`/Users/cosmokaat/.claude/projects/-Users-cosmokaat-dev-pfa/memory/` :
- `project_ui_refacto.md` — état du refacto (miroir condensé de ce doc).
- `project_categories.md` — règle catégories + MAJ mock-create.
- `feedback_workdir.md` — bosser dans le repo principal, jamais un worktree.
- `feedback_scope_strict.md` — ne changer que ce qui est demandé.
- `feedback_screenshot_concept.md` — screenshots = concept, pas code à retrouver.

---

_Reprise : lire ce doc + `git log --oneline` sur `ui-refacto`, puis continuer à la Phase 3b (§9)._
