# REFACTO UI — Notes de reprise

> Doc de handoff pour le gros refacto UI de **pfa** (front Next.js). À lire en premier pour reprendre le fil.
> Branche : **`ui-refacto`** (repo principal `/Users/cosmokaat/dev/pfa`, **jamais** un worktree).
> État : **toutes les phases de construction (0→7) sont implémentées et commitées**, working tree clean, branche poussée sur `origin` + **PR ouverte vers `master`**. Prochaine étape = **passe d'audit** (bugs / oublis / mock-vs-réel), pas de nouvelle feature.

---

## 1. Objectif

Re-skin complet du front à partir du handoff de design **`design_handoff_pfa/`** (désormais **gitignore**) :
- `README.md` — cahier des charges (⚠️ pas toujours à jour, l'utilisateur a modifié les screenshots).
- `designs/*.html` — maquettes HTML/CSS/JS vanilla (références de rendu + comportement, **pas** du code de prod).
- `designs/assets/` — `pfa.css` + `pfa-glow.css` (design system, source de vérité tokens) + JS de démo (formes de données).
- `screenshots/` — rendus PNG (= **concept**, pas du code à retrouver, cf mémoire `feedback_screenshot_concept`).

Principe : **reproduction fidèle** (pas pixel-perfect), réimplémentation en **React + shadcn**. Features nouvelles sans back = **données mock** marquées `// MOCK` (jamais différées ni omises, cf mémoire `feedback_mock_not_defer`).

## 2. Stack

Next.js 16 · React 19 · Tailwind v4 · shadcn (new-york) · zustand · react-query · react-day-picker v7 · zod · react-hook-form · sonner. **Data-viz = lib SVG maison** (`@lib/dataviz`, recharts **retiré** du projet). Thème **sombre exclusif** (`<html class="dark">`). Back = NestJS (dev sur `localhost:6100`).

## 3. Décisions actées (via l'utilisateur)

- **Tokens** : palette oklch pfa = source unique dans `styles/globals.css`, tokens sémantiques shadcn **remappés** dessus. Vert de marque = `--primary` / `--accent-strong`. ⚠️ Pièges tokens récurrents dans les corrections :
  - maquette `var(--accent)` = **VERT** → dans l'app c'est **`--accent-strong`** (le `--accent` de l'app = **gris/hover**, PAS le vert) ;
  - `--pos` **n'existe pas** dans l'app → un « positif » vert = `--accent-strong` ;
  - `--neg` = rouge ; `--exc` = **bleu** (exceptionnels).
- **Polices** : Geist + Geist Mono via `next/font` (pas de CDN). Base = Geist. **`.num` = Geist Mono tabular** → à mettre sur **tout nombre significatif**.
- **Identifiants de code EN ANGLAIS** uniquement (fichiers, composants, dossiers, classes), même si l'UI est en français (cf mémoire `feedback_english_identifiers`).
- **Alias de path uniquement** (`@components/…`, `@lib/…`), jamais de relatifs `./` `../`, même intra-module (cf mémoire `feedback_path_aliases`).
- **Catégories** : bouton « Nouvelle catégorie » affiché mais **création mock-only** (locale, non persistée) — **pas de `POST /categories`**. Édition/suppression = réelles. Création réelle uniquement **implicite** via combobox du SpendingModal (cf mémoire `project_categories`).
- **Cadence** : spec courte + validation utilisateur **par phase**. Specs dans `docs/superpowers/specs/`. Commit en fin de phase sur cette branche.
- **Signup** : email + mot de passe + **confirmation** (client-only).

## 4. Avancement (tout commité sur `ui-refacto`)

| Phase | Contenu | Commit |
|---|---|---|
| Spec 0+1 | doc | `6c5cc34` |
| **0** Fondations | tokens remappés, Geist, `<Logo>`, Button `primary` dégradé | `3dbb94a` |
| **1** Auth | shell à onglets (`AuthHeader`/`AuthCard`/`AuthBrand`), Login redessiné, **Signup** (+confirm), **About**, Forgot ; NavBar retiré du public | `3dbb94a` |
| **2** Chrome app + Catégories | `NavBar`→barre glow sticky (`.pfa-hdr`), `UserMenu`, drawer mobile ; page Catégories (grille glow, édition nom+couleur réelle, delete réel, création+stats **mock**) | `768cccf` |
| **3a** Split routes | structural (Dashboard mensuel ⇆ Dépenses hebdo) | `3a7064d` |
| **3b/3c/4** Dépenses + Modales + Exceptionnels | redesign vue Dépenses ; `SpendingModal`/`InvoiceModal`/lightbox ; re-skin Exceptionnels (déjà 100% réel) | `2a23973` (+docs `38bb3dc`) |
| **5a** Lib data-viz | SVG maison : `Donut`/`LineChart`/`BarChart`/`StackedBar`/`ProgressTrack` + adapters | `e442565` (+alias `48ce7ad`) |
| **5b** Dashboard | `/dashboard` reconstruit sur la lib : `MonthSelector`, hero, répartition, plafond, dépenses fixes (réels) + insights/forecast/sparkline (mock) | `daca890` + `649df99` (+docs `16d7211`) |
| **5c** Dashboard finition | MonthSelector+« Aujourd'hui » dans le header, `EditGlyph`, forecast hachuré, **animations** (`AnimatedNumber`/`useCountUp`/`useTween`), fix « budget du jour » | `a68cd01` |
| **6a** Statistiques | filtres, 4 KPI, forecast, `StatMiniChart` (sur la lib maison) | `b846540` |
| **6b** Statistiques | monthly chart, category chart, heatmap (mock), top-cats (réel), fixed (réel), day-of-week (mock) | `dbd3d38` |
| cleanup | arbre mort `spendingDashboard/` supprimé, puis `recharts` retiré | `5ea4cef` + `90e3a33` |
| **7** Week-picker « Capsule » | restyle react-day-picker v7 (`.DayPicker-*`) | `f7e9659` |
| **7** Rationalisation routes + modules + **pass mobile** | voir §5, §6 | `ba3b1f1` |

## 5. Routing actuel ⚠️ (les anciennes notes sont PÉRIMÉES)

Piloté par `ROUTES` (`@components/shared/config/constants`) + `src/helpers/dateRoute.ts`.

- **`/spendings`** = **Dépenses** (vue **hebdo**, porte le `?date=` ; helpers `SPENDINGS_PATH`/`buildSpendingsPath`). Client : `@components/spendings/view/SpendingPageClient`.
- **`/dashboard`** = **Dashboard mensuel** (le hub). Client : `@components/dashboard/DashboardPageClient` → `DashboardView`.
- **`/exceptionals`** · **`/categories`** · **`/statistics`**.
- Login + index privé `(private)/page.tsx` → redirigent vers **`/dashboard`**.
- Nav (`NavBar`) : Dashboard(`/dashboard`) · Dépenses(`/spendings`) · Exceptionnels · Catégories · Statistiques.

## 6. Arborescence des modules (après Phase 7)

`front/src/components/` :
- **`dashboard/`** (ex-`overview/`) — Dashboard mensuel : `DashboardView`, `DashboardPageClient`, `MonthSelector`, `EditGlyph`, `sections/*` (BudgetHero, CategoryBreakdown, WeeklyCeiling, FixedExpenses, InsightsRibbon, ForecastStrip, DailySparkline).
- **`spendings/`** — Dépenses. `view/` = la vue hebdo (ex-module `spending/`, fondu ici) : `SpendingView`, `SpendingToolbar`, `SpendingSummary`, `SpendingCategoryBreakdown`, `SpendingCategoryFilter`, `SpendingDayCard`, `SpendingTxRow`, `helpers/`. `common/spendingModal/` = `SpendingModal` + `mockSuggestions.ts`. Modales facture (`InvoiceModal`, `InvoiceImageModal`).
- **`statistics/`** — page Statistiques (tous les widgets sur `@lib/dataviz`).
- **`exceptionals/`**, **`categories/`**, **`auth/`**, **`login/`**.
- **`shared/`** — `brand/Logo.tsx`, **`GlowCard.tsx`** (wrapper `.pfa-card`, utilisé par tous les widgets stats), **`ExportButton.tsx`** (partagé, **mock**), `config/constants.ts` (`ROUTES`).
- **`datePickerWrapper/`** — week-picker « Capsule ».
- **`ui/`** — primitives shadcn.

`front/src/lib/` :
- **`dataviz/`** (`@lib/dataviz`) — lib SVG maison. Seul lien app restant : `adapters.ts` importe `ChartsCategory` de `@src/schemas/stats` (à sortir si un jour extraite en package).

## 7. AUDIT — inventaire RÉEL vs MOCK ⚠️ (corrige le README)

**Convention : tout mock est marqué `// MOCK`.** Énumération complète : `grep -rn "MOCK" front/src`. Fichiers mock **dédiés** (3) :
`categories/helpers/mockCategoryStats.ts` · `spendings/common/spendingModal/mockSuggestions.ts` · `spendings/view/helpers/mockSpending.ts`.

### Déjà branché sur l'API — **ne PAS mocker**
CRUD dépenses (`/spendings`) · catégories (`/categories`, création à la volée client) · récurrents (`/recurrings`) · **reçus/factures** (`POST /spendings/upload`, 32 Mo, jpg/png/webp/gif) · tri · stats hebdo/mensuelles (`/weeklystats`, `/monthlystats`) · charts catégories (`/spendings/charts`) · salaire/plafond (`/dashboard`) · exceptionnels (`/exceptionals[?year]`, `/exceptionals/years`, CRUD, `regular-monthly-average`) · stats annuelles (`/statistics` + dérivés) · **top-catégories & YoY** (Statistiques) · **charges fixes annualisées** (Statistiques, via `useReccurings`).

### Zones MOCK (par page)
| Zone | Fichier(s) | Ce qui est mock |
|---|---|---|
| **Dépenses** | `view/helpers/mockSpending.ts`, `SpendingSummary`, `SpendingCategoryBreakdown` | deltas « vs semaine dernière » (avg/jour), trend catégorie (flèches). Le « vs plafond » est **réel** (`dashboard.initialCeiling`). |
| **Modale dépense** | `spendingModal/mockSuggestions.ts`, `SpendingModal` | suggestions de label ; **classement** des chips « Fréquentes » (la *sélection* = 6 vraies catégories, seul le *classement* est mock) ; **reçu-à-la-création** = aperçu `FileReader` **visual-only, non uploadé au submit** (`POST /spendings` ne renvoie pas d'ID → reçu ajouté après création via l'icône reçu). |
| **Dashboard** | `sections/InsightsRibbon`, `ForecastStrip`?, `DailySparkline`, `CategoryBreakdown` | ruban insights (pace « ~x% moins vite », trend) ; queue de projection du sparkline ; trend mois-sur-mois du breakdown (projections/comparaisons dérivées). |
| **Catégories** | `helpers/mockCategoryStats.ts`, `CategoriesListcontainer` | création standalone non persistée (pas de `POST /categories`) ; stats d'usage `% · N fois`. |
| **Statistiques** | `StatisticsKpis`, `StatisticsForecast`, `StatisticsMonthlyChart`, `StatisticsHeatmap`, `StatisticsDayOfWeek`, `StatisticsFixedExpenses` | KPI carte 4 « plus grosse dépense courante » (approx. depuis la top-catégorie, pas d'endpoint par-transaction) ; forecast fin d'année (average-forward, **toujours vert**) ; ligne budget mensuel **plate** + projection mois courant du monthly chart ; **heatmap quotidienne** (entièrement mock, seeded déterministe — pas d'endpoint par-jour) ; **jour-de-semaine** (entièrement mock) ; « déjà prélevé » des charges fixes (dérivé du jour de `dateFrom`). |
| **Partout** | `shared/ExportButton` | bouton Export = toast, **non câblé**. |

> Note : dans `StatMiniChart`/`StatisticsFixedExpenses` etc., les commentaires « per the mockup / like the mockup » désignent la **maquette de design**, pas une donnée mock — ne pas confondre avec `// MOCK`.

## 8. OUBLIS / BUGS CONNUS — à compléter pendant l'audit

> Section à remplir. Ce qui est **déjà identifié** :
- **Pass mobile Phase 7 inachevé** (findings restants du workflow d'audit mobile) :
  - labels des charts Statistiques illisibles à **375px** → proposer un **scroll horizontal** ;
  - **cibles tactiles < 40px** (chips/filtres/boutons d'action des cartes) ;
  - **sheet facture** en version mobile ;
  - **collapse des récurrents** en mobile (réf. maquette `Recurrings collapse mobile.html`).
- _(placeholder — oublis repérés par l'utilisateur à consigner ici avant de changer de session)_

## 9. Design system — repères

- `styles/globals.css` : tokens pfa (bloc `.dark`), remap shadcn, `@theme inline` (utilitaires `text-ink-*`, `bg-exc`, `border-line`…, fonts) + classes signature : `.pfa-hdr`, `.pfa-card`/`.pfa-card-hover`, `.pfa-drawer`/`.pfa-scrim`, `.sp-*` (Dépenses), `.exc-*` (Exceptionnels), `.DayPicker-*` (week-picker Capsule), `.auth-grain`, `.pfa-logo-pulse`, `.num`.
- `shared/brand/Logo.tsx` : IDs de dégradé **déterministes** (`pfaStrokeGlow`/`pfaStrokePlain`/`pfaTileGlow`) — **NE PAS** repasser à `useId` (mismatch d'hydratation, déjà corrigé).
- `shared/GlowCard.tsx` : wrapper `.pfa-card` (fond `bg-elev` + border gradient glow). **Tous** les widgets Statistiques l'utilisent ; les autres pages appliquent encore `.pfa-card` en brut (non migrées — piste d'harmonisation).
- `ui/button.tsx` : variante `primary` (dégradé vert→cyan).
- Animations dashboard : `AnimatedNumber` + `useCountUp` (count-up), `useTween` (grow-from-zero + ease-from-current pour `ProgressTrack` ; ⚠️ une `transition` CSS sur la largeur ne se déclenchait pas de façon fiable → tween JS piloté par état React).

## 10. Contraintes de vérification (⚠️ lire avant de tester)

- **Espace privé non vérifiable côté agent** : le layout `(private)` redirige vers `/login` sans session, et l'agent n'a ni l'API ni les identifiants. → validé par `tsc` + `eslint` + compilation, PUIS **l'utilisateur valide le rendu loggé**. Un serveur dev tourne parfois sur `:3000` (celui de l'utilisateur, ou un preview lancé par l'agent).
- **⚠️ Cache CSS Turbopack périmé** : après de gros ajouts dans `globals.css` (classes `.sp-*`/`.exc-*`/`.DayPicker-*`), Next 16/Turbopack peut servir un **CSS périmé** (classes custom absentes → layout cassé) alors que le source est correct. **Fix : `rm -rf front/.next` + relancer le dev.** (Pas un bug de code.)
- **⚠️ Week-picker** : NE PAS ré-importer `react-day-picker/lib/style.css` (elle charge après globals et écrase le style → bande bleue / flèches triangles / hover blanc).
- **Node / preview** : `.claude/launch.json` (gitignore) pointe le preview sur **node 20** car le node système est 18 (< requis Next 16). Lancer avec **node ≥ 20.9**.
- **tsc préexistant** : l'ancienne erreur `spendingDashboard/…` a disparu (arbre supprimé). Reste éventuellement `ui/form.tsx` (React UMD) — préexistant, hors périmètre, ne pas corriger sauf demande.

## 11. Statut Git / PR

- Branche `ui-refacto` **poussée** sur `origin` (`git@github.com:aestheticsdata/pfa.git`), upstream configuré.
- **PR ouverte** vers `master` sur GitHub (créée par l'utilisateur).
- Working tree **clean**, toutes les phases 0→7 commitées.

## 12. Mémoire agent (auto, persiste entre sessions)

`/Users/cosmokaat/.claude/projects/-Users-cosmokaat-dev-pfa/memory/` — index dans `MEMORY.md`. Clés : `project_ui_refacto` (miroir condensé de ce doc), `project_categories`, `feedback_workdir`, `feedback_scope_strict`, `feedback_english_identifiers`, `feedback_path_aliases`, `feedback_mock_not_defer`, `feedback_screenshot_concept`, `feedback_faithful_reproduction`, `feedback_commit_timing`.

---

_Reprise : lire ce doc + `git log --oneline master..ui-refacto`, puis lancer la **passe d'audit** (§7 mock-vs-réel, §8 oublis/bugs)._
