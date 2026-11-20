# PFA mobile — brief pour Claude Code

Construire l'app mobile **native iOS + Android** de PFA (finances personnelles) en **React Native (Expo)**.
PFA existe en web (Next.js, front) avec un backend **NestJS** auto-hébergé ; l'app mobile consomme **la même API**.
Elle doit se comporter comme une vraie app native, pas comme un site responsive.

## Contenu de ce dossier

| Chemin | Rôle |
|---|---|
| `CLAUDE.md` | Ce brief : stack, architecture, règles, ordre de travail |
| `SPEC.md` | Spécification écran par écran (contenu, interactions, états, critères d'acceptation) |
| `src/theme/tokens.ts` | Tokens du design system, prêts à l'emploi (couleurs clair/sombre, typo, espacements, rayons, dégradés, recettes de composants) |
| `design/screens/NN-Nom.png` | Maquette de chaque écran, **clair à gauche, sombre à droite** (iPhone 393×852 ; Android 412×915) |
| `design/html/NN-Nom.html` | Même maquette en HTML statique : valeurs exactes (px, couleurs, tailles) à inspecter |
| `design/source/NN-Nom.dc.html` | Source d'origine (format canvas), pour référence seulement |

**Règle d'or : ouvre la PNG de l'écran avant de le coder, et le HTML pour les valeurs exactes.** Les maquettes font foi pour la mise en page ; `SPEC.md` fait foi pour le comportement ; `tokens.ts` fait foi pour les valeurs visuelles.

## Stack imposée

- Expo SDK récent + TypeScript strict, **expo-router** (onglets + piles typées).
- UI : composants maison sur `tokens.ts` (pas de kit UI tiers). `react-native-reanimated` + `react-native-gesture-handler`.
- Bottom sheets : `@gorhom/bottom-sheet` (détentes moyenne/grande).
- Graphiques : `react-native-svg` (courbes, barres, calendrier). Pas de lib de charts lourde.
- Dégradés : `expo-linear-gradient` ; verre de la barre d'onglets : `expo-blur`.
- Données : TanStack Query + persistance (`@tanstack/query-async-storage-persister` sur MMKV) ; file d'attente hors ligne persistée (MMKV).
- Biométrie : `expo-local-authentication` ; secrets/jetons : `expo-secure-store`.
- Notifications : `expo-notifications` (jeton push envoyé au backend ; seuils calculés côté serveur).
- Polices : **Geist** et **Geist Mono** embarquées via `expo-font` (paquet npm `geist`, fichiers `dist/fonts/...woff2` → convertir/charger les `.ttf`/`.otf`, ou `@expo-google-fonts/geist` + `@expo-google-fonts/geist-mono`).
- Haptique : `expo-haptics` (ajout validé, suppression, seuil franchi).
- Tests : Jest + React Native Testing Library ; e2e Maestro pour les parcours critiques.

## Architecture

```
app/
  _layout.tsx              // ThemeProvider (clair/sombre/système), QueryClient, verrou biométrique
  lock.tsx                 // 01 Verrouillage
  (tabs)/_layout.tsx       // Barre d'onglets : Accueil, Dépenses, Exceptionnels, Stats + bouton « + »
  (tabs)/home/index.tsx    // 02 Tableau de bord
  (tabs)/spendings/index.tsx        // 04 Dépenses (semaine)
  (tabs)/spendings/[id].tsx         // 16 Détail d'une dépense + ticket
  (tabs)/exceptionals/index.tsx     // 07 Exceptionnels
  (tabs)/stats/index.tsx            // 08 Statistiques
  (tabs)/stats/heatmap.tsx          // 17
  (tabs)/stats/weekdays.tsx         // 18
  (tabs)/stats/search.tsx           // 19
  (tabs)/stats/top-categories.tsx   // 20
  (tabs)/home/categories/index.tsx  // 06 Catégories (pile de l'onglet Accueil)
  (tabs)/home/categories/[id].tsx   // 05 Détail catégorie
  (tabs)/home/fixed.tsx             // 21 Dépenses fixes
  settings/index.tsx                // 22 Réglages (barre d'onglets masquée)
  settings/notifications.tsx        // 10 Notifications
  (sheets)/add-spending.tsx         // 09 Saisie rapide (bottom sheet, ouverte par « + » depuis partout)
  (sheets)/category-edit.tsx        // 23 Nouvelle/modifier catégorie (bottom sheet)
src/
  theme/tokens.ts  theme/ThemeProvider.tsx  theme/useTheme.ts
  ui/        // Button, IconButton, Card (GlowCard), ListRow, SectionHeader, TextField, Chip, Segmented,
             // Switch, Badge, Meter, Amount, CategoryMarker, TabBar, BottomSheet, EmptyState, ErrorState,
             // Skeleton, OfflineBanner, Toast
  charts/    // Sparkline, MonthlyBars, Heatmap, RangeBar, TimelineBars
  api/       // client HTTP typé, hooks TanStack Query par ressource
  offline/   // file d'attente des mutations, état réseau (expo-network / NetInfo)
  format/    // formatage monétaire fr-FR, dates, pourcentages
```

Adapter les chemins si expo-router l'exige, mais **garder les 4 onglets + piles + sheets** tels quels.

## Règles visuelles (non négociables)

1. **Toute valeur vient de `tokens.ts`** : aucune couleur, taille ou rayon en dur dans les écrans.
2. **Mode sombre = tokens PFA web à l'identique** ; mode clair dérivé. Suivre le réglage système par défaut, avec un choix Système / Clair / Sombre dans Réglages.
3. **Montants** : composant `<Amount>` en Geist Mono, chiffres tabulaires, partie décimale en `ink3`, format `fr-FR` (`1 577,18 €`, espace insécable fine). Jamais de montant en Geist sans-serif.
4. **Couleur = sens** : `positive` (vert) = sous le budget, baisse ; `negative` (rouge) = hausse, dépassement, destructif ; `accent` (cyan) = sélection, « aujourd'hui », liens ; `exceptional` (bleu) = dépenses exceptionnelles ; `warning` (orange) = hors ligne, échéance. Toujours doubler la couleur d'un signe (↑ ↓, texte) pour l'accessibilité.
5. **Pas de violet**, nulle part (préférence ferme du propriétaire).
6. **Catégories** : couleur seulement en marqueur (4×30) ou pastille (8×8), jamais en aplat de fond. Palette clair/sombre dans `categoryColors`.
7. **Bouton principal** : dégradé `cta` vert → bleu, texte `onCta`, un seul par écran. Le « + » de la barre d'onglets utilise le même dégradé.
8. **Cartes** = GlowCard : fond `surface`, bordure 1 px en dégradé `glow`, ombre seulement en clair.
9. **Cibles tactiles** ≥ 44 pt (iOS) / 48 dp (Android) ; utiliser `hitSlop` pour les chips de 36 pt.
10. **Pas d'IBM Plex**, pas d'emoji, pas d'icônes remplies : icônes au trait 1,75 (lucide-react-native ou SF Symbols / Material Symbols selon la plateforme, au trait).

## Différences iOS / Android

| Élément | iOS | Android |
|---|---|---|
| Navigation | Barre d'onglets flottante (capsule en verre, `expo-blur`) + bouton « + » rond détaché à droite | Navigation bar Material 3 (indicateur pilule 64×32 `accentBg`) + FAB étendu « + Dépense » au-dessus |
| En-tête | Grand titre (32/38) qui se replie en titre compact au scroll | Top app bar « medium » (28/36), actions à droite (icônes 48 dp) |
| Retour | Chevron + libellé de l'écran parent, geste de bord | Flèche, retour système (prédictif Android 14+) |
| Feuilles | Sheet à détentes, poignée 36×5 | Modal bottom sheet M3, poignée, scrim |
| Interrupteurs | Switch iOS (51×31) | Switch M3 (avec coche dans le pouce) |
| Biométrie | Face ID (`NSFaceIDUsageDescription` dans app.json) | BiometricPrompt (empreinte / visage) |
| Rayon des cartes | 20 | 16 |

Référence : `design/screens/03-Android.png` + `02-Dashboard.png`.

## Données et API

- **Ne pas inventer l'API** : lire le backend NestJS de PFA (et les appels du front Next.js) pour trouver les endpoints réels de : dépenses (CRUD, recherche, ticket/image), catégories (CRUD, motifs/libellés), exceptionnels, dépenses fixes, budget mensuel, plafond hebdo, statistiques (mensuel, calendrier, jours de la semaine, top catégories, recherche dans le temps), export CSV, authentification.
- Si un besoin mobile n'a pas d'endpoint (ex. enregistrement du jeton push, préférences de notification), **lister les endpoints manquants dans `docs/api-gaps.md`** et proposer leur contrat ; ne pas les implémenter côté serveur sans validation.
- Montants : manipuler en **centimes entiers** côté client ; formater seulement à l'affichage.
- Dates : fuseau Europe/Paris ; semaine du **lundi au dimanche**.

## Hors ligne

- Lecture : tout écran déjà visité s'affiche depuis le cache persisté, avec le bandeau « Hors ligne · données du <date> » (écran 13).
- Écriture : l'ajout d'une dépense fonctionne hors ligne (mise à jour optimiste + file d'attente persistée, libellé « En attente de synchronisation ») ; modification et suppression désactivées hors ligne.
- Au retour du réseau : rejouer la file dans l'ordre, puis invalider les requêtes ; en cas d'échec, toast d'erreur avec « Réessayer » (écran 14).

## Sécurité

- Verrou biométrique à l'ouverture et après 1 min en arrière-plan (réglable). Montants masqués (`• ••• ••`) tant que l'app est verrouillée et dans l'aperçu du sélecteur d'apps (`expo-screen-capture` / flou à l'inactivité).
- Jeton d'API dans `expo-secure-store`, jamais dans AsyncStorage/MMKV en clair.

## Accessibilité

- `accessibilityRole`, `accessibilityLabel` sur tous les boutons-icônes ; montants lus en entier (« mille cinq cent soixante-dix-sept euros dix-huit »).
- Dynamic Type / échelle de police : texte jusqu'à 1,6×, montants plafonnés à 1,4× (`maxFontSizeMultiplier`).
- Contraste ≥ 4,5:1 (déjà garanti par les tokens) ; respecter « Réduire les animations ».

## Ordre de travail recommandé

1. Socle : Expo + expo-router, polices, `ThemeProvider` (clair/sombre/système), `tokens.ts`.
2. Composants `src/ui` + page de démo interne reproduisant `design/screens/15-DesignSystem.png` (clair et sombre).
3. Navigation (onglets + piles + sheets) avec écrans vides, plateformes iOS et Android.
4. Client API + auth + verrou biométrique (01).
5. Écrans dans l'ordre : 02 → 04 → 16 → 09 → 06 → 05 → 23 → 07 → 08 → 17-20 → 21 → 22 → 10.
6. États 11-14 sur chaque écran (vide, squelettes, hors ligne, erreur).
7. Notifications push (10) puis hors ligne complet.
8. Tests (unitaires sur formatage et file d'attente, Maestro : verrou → ajout d'une dépense → visible dans Dépenses).

À chaque écran : comparer visuellement au PNG (clair **et** sombre, iOS **et** Android) avant de passer au suivant.
