# PFA mobile — spécification écran par écran

Pour chaque écran : maquette `design/screens/NN-*.png` (clair | sombre), valeurs exactes dans `design/html/NN-*.html`.
Les données des maquettes sont fictives : les remplacer par les données de l'API.
Commun à tous les écrans avec onglets : barre d'onglets (iOS : capsule + « + » ; Android : navigation bar + FAB), dégradé de fondu sous la barre, contenu qui défile sous la barre.

---

## Carte de navigation

```
Verrouillage (01)
└── Onglets
    ├── Accueil ─ Tableau de bord (02)
    │   ├── Catégories (06) ─ Détail catégorie (05) ─ [sheet] Modifier catégorie (23)
    │   │                   └ [sheet] Nouvelle catégorie (23)
    │   ├── Dépenses fixes (21)
    │   └── avatar « SC » ─ Réglages (22) ─ Notifications (10)
    ├── Dépenses (04) ─ Détail d'une dépense (16)
    ├── Exceptionnels (07) ─ Détail d'une dépense (16)
    └── Stats (08) ─ Calendrier (17) · Jours de la semaine (18) · Recherche (19) · Top catégories (20)
« + » (partout) ─ [sheet] Saisie rapide (09)
```

---

## 01 · Verrouillage — `01-Lock.png`
- Logo PFA (tuile `surface2`, courbe `positive`), nom, sous-titre.
- Carte « Reste à dépenser · <mois> » avec montant masqué `• ••• ••`.
- Bas d'écran (zone du pouce) : icône Face ID, bouton principal « Déverrouiller avec Face ID » (Android : « Déverrouiller »), bouton texte « Saisir le code ».
- Comportement : lance la biométrie automatiquement à l'affichage ; échec → reste sur l'écran ; « Saisir le code » → code de l'appareil (`disableDeviceFallback: false`).
- Critères : jamais de montant réel visible avant déverrouillage ; verrouillage auto après le délai réglé (défaut 1 min).

## 02 · Tableau de bord — `02-Dashboard.png` (Android : `03-Android.png`)
- En-tête : surtitre « Tableau de bord », boutons Notifications et avatar (→ Réglages) ; titre = mois courant avec chevron → sélecteur de mois (sheet).
- Carte héros : « Reste à dépenser », badge « ↓ Dans le budget » (`positive`) ou « ↑ Hors budget » (`negative`), montant XL, « sur <budget> · <x> €/jour jusqu'au <fin> », jauge (remplissage `fill`, marqueur « aujourd'hui » `accent`, projection hachurée), « Dépensé au <date> » / « Projection fin de mois » (couleur selon sous/au-dessus du budget).
- Carrousel horizontal de constats (Rythme, Catégorie en hausse, Semaine chargée) ; cartes 228 de large, la suivante dépasse pour suggérer le défilement.
- Carte « Jour par jour » : courbe des dépenses quotidiennes du mois (`positive`), ligne de moyenne pointillée, point du jour `accent`, moy. et pic. Toucher-glisser : info-bulle du jour.
- Carte « Plafond hebdo » : une ligne par semaine du mois (dates, jauge, montant) ; semaine au-dessus du plafond → jauge et montant `negative`.
- Sous la ligne de flottaison (à ajouter, même style) : « Répartition par catégorie » (barre empilée + 4 lignes + « Tout voir » → 06) et « Dépenses fixes » (mensuel / annualisé → 21).
- Tirer pour rafraîchir.

## 04 · Dépenses (semaine) — `04-Spendings.png`
- Grand titre, boutons Rechercher (→ 19 pré-filtré) et Exporter.
- Sélecteur de semaine (‹ dates ›) + bandeau 7 jours (L…D, total du jour) ; jour sélectionné encadré `accent`. Balayer horizontalement = semaine précédente/suivante.
- Carte Semaine : total, « Plafond 420 € », « −x € restants » (`positive`) ou dépassement (`negative`), jauge.
- Chips de filtre par catégorie (défilement horizontal, compteur) ; chip active = `positiveBg` + contour.
- Liste groupée par jour (en-tête : jour + total du jour ; aujourd'hui en `accent`, jour lourd avec « ↑ » `negative`). Ligne : marqueur catégorie, libellé, catégorie, icône ticket si photo, montant.
- Balayage à gauche sur une ligne : « Modifier » (`surface3`) et « Supprimer » (`negativeSolid`) ; balayage complet = supprimer avec annulation (toast « Annuler » 5 s). Toucher une ligne → 16.

## 05 · Détail catégorie — `05-CategoryDetail.png`
- Retour « Catégories », bouton Modifier (→ sheet 23).
- Tuile couleur + nom + « <mois> · n opérations » ; carte total du mois + badge vs mois précédent + part des variables.
- Segmented « Par enseigne | Par jour ».
- Par enseigne : lignes nom ×occurrences, %, montant, barre fine couleur catégorie (« Autres » en gris).
- Par jour : sections par date avec total du jour et cumul (% du mois), lignes des dépenses.

## 06 · Catégories — `06-Categories.png`
- Retour « Accueil », bouton « + » (→ sheet 23 en création).
- Grand titre + compteur, champ de recherche, sous-titre explicatif.
- Liste : tuile couleur 28, nom, « x % · n fois », chevron → 05. Balayage : Modifier / Supprimer (confirmation : que deviennent les dépenses ? → réassigner à « Autres »).

## 07 · Exceptionnels — `07-Exceptionals.png`
- Grand titre, « + » → sheet 09 avec « Exceptionnelle » activé.
- Segmented années (2026, 2025, 2024, Tout).
- 4 tuiles 2×2 : Total de l'année, Moyenne/mois (lissée), La plus élevée, Part du total.
- Sections par mois (total à droite) ; carte par dépense : date, titre, tag catégorie, « ≈ x mois de budget », montant. Toucher → 16.

## 08 · Statistiques — `08-Statistics.png`
- Grand titre, sélecteur d'année (chip 44 pt).
- Chips bascules « vs <année-1> » et « Exceptionnels ».
- Carte total de l'année + badge vs année précédente + moyenne/mois ; histogramme 12 mois : courantes (`bar`), exceptionnelles empilées (`exceptional`), mois sélectionné en `ink` avec info-bulle, mois futur en pointillé, année précédente en pointillés, budget en tirets. Toucher une barre = la sélectionner.
- Carte « Projection fin d'année » : montant, jauge (réel + projection hachurée), jours écoulés · €/jour, badge vs année précédente.
- Liste de liens : Calendrier de chaleur (17), Jours de la semaine (18), Recherche dans le temps (19), Top catégories (20).

## 09 · Saisie rapide (bottom sheet) — `09-QuickAdd.png`
- Ouverte par le « + » depuis n'importe quel onglet ; détente grande ; l'écran de fond se réduit (iOS).
- Fermer (×), titre « Nouvelle dépense ».
- Montant XL avec curseur, saisi au **pavé numérique intégré** (1-9, virgule, 0, effacer ; touches 48 pt) — pas de clavier système pour le montant.
- Chip date/heure (défaut : maintenant) → sélecteur natif.
- Champ Libellé avec autocomplétion sur l'historique ; choisir une suggestion pré-remplit la catégorie (« suggérée par l'historique »).
- Chips de catégorie (récentes d'abord, « Autre… » → liste complète).
- Bascule « Exceptionnelle » ; bouton « Ticket » → appareil photo / photothèque.
- Bouton principal « Ajouter <montant> » (désactivé si montant = 0). Succès : haptique, fermeture, la dépense apparaît dans 04 (optimiste). Hors ligne : mise en file d'attente.
- Validation : montant > 0 obligatoire (message `negative` sous le champ, cf. design system).

## 10 · Réglages des notifications — `10-Notifications.png`
- Aperçu d'une notification en tête.
- Budget : interrupteur « Seuils du budget mensuel » + pastilles de seuils multi-sélection (50, 75, 90, 100 %) ; « Plafond hebdo dépassé » ; « Dépense inhabituelle » (seuil en €, → sélecteur).
- Échéances : « Prélèvements à venir » (+ résumé du prochain) ; « Prévenir » J-1 / J-3 / J-7 ; « Récap hebdomadaire » (jour + heure).
- Heures calmes : plage + interrupteur.
- Note : une alerte par seuil et par mois ; masquage des montants sur l'écran verrouillé selon Réglages › Confidentialité.
- Persister côté serveur (les alertes sont envoyées par le backend).

## 11 · État vide — `11-StateEmpty.png`
- Exemple sur Dépenses : carte semaine à 0,00 € en `ink3`, illustration au trait, titre, explication, bouton secondaire « Importer un relevé (CSV) ». Le « + » reste l'action principale.
- Prévoir un état vide pour chaque liste (catégories, exceptionnels, recherche sans résultat, fixes).

## 12 · Chargement — `12-StateLoading.png`
- Premier chargement uniquement : squelettes (`surface3`) reproduisant la structure de l'écran + ligne « Synchronisation avec le serveur… ».
- Rechargements suivants : données en cache affichées immédiatement, pas de squelette.

## 13 · Hors ligne — `13-StateOffline.png`
- Bandeau `warningBg` sous le titre : « Hors ligne », « Données du <date heure> », bouton « Réessayer ».
- Dépense créée hors ligne : sous-titre « En attente de synchronisation » (`warning`, icône horloge).
- Texte d'aide : lecture OK, modification/suppression désactivées.

## 14 · Erreur — `14-StateError.png`
- Erreur bloquante (écran sans cache) : icône `negativeBg`, titre, explication rassurante, bouton principal « Réessayer », code + heure + référence en `amountS`.
- Erreur ponctuelle (mutation échouée) : toast inversé au-dessus de la barre d'onglets avec action « Réessayer ».

## 15 · Design system — `15-DesignSystem.png`
- Référence visuelle de tous les tokens et composants, clair et sombre. À reproduire dans un écran de démo interne (dev seulement).

## 16 · Détail d'une dépense — `16-SpendingDetail.png`
- Retour (écran d'origine), bouton « Modifier » (→ sheet 09 pré-rempli).
- Tag catégorie, libellé, montant XL.
- Liste : Date, Catégorie (→ choix), Exceptionnelle (interrupteur), « Ce mois-ci chez ce marchand » (n × total).
- Carte Ticket : photo (toucher = plein écran avec zoom), « Remplacer », « Supprimer le ticket » ; sans ticket : bouton « Ajouter un ticket ».
- « Supprimer la dépense » en texte `negative` + confirmation.

## 17 · Calendrier de chaleur — `17-Heatmap.png`
- 3 tuiles : jour max (hors exceptionnels), plus longue série calme, nombre de pics exceptionnels.
- Grille verticale semaines × jours (L…D), étiquette du mois à gauche, défilement vertical sur l'année, s'ouvre sur la semaine courante. Niveaux : calme `positiveBg`, normal `bar`, intense `positive`, exceptionnel `exceptional`, futur = contour.
- Toucher une case : info-bulle date + montant. Légende avec effectifs.

## 18 · Jours de la semaine — `18-Weekdays.png`
- Chips résumé : pic, creux, écart week-end.
- Une ligne par jour : nom, moyenne (couleur : ≤ 60 € `positive`, 60-120 € `warning`, > 120 € `negative`), barre proportionnelle, repère de moyenne en tirets, opérations/jour, comparaison année précédente avec ↑/↓.
- Seuils 60/120 € à lire depuis l'API/config si elle les expose.

## 19 · Recherche dans le temps — `19-SearchTimeline.png`
- Champ de recherche (libellé) avec effacement ; recherche au fil de la frappe (debounce 300 ms).
- Total, occurrences (`positive`), fréquence moyenne, montant moyen, dernière date.
- Segmented 1 mois / 1 an / 3 ans.
- Graphe : une barre fine par achat (montant), courbe de fréquence glissante 30 j (`positive`), pic annoté.
- Dernières occurrences (date, libellé, montant) → 16.

## 20 · Top catégories — `20-TopCategories.png`
- Segmented Montant / Fréquence / Évolution (change le tri).
- Barre empilée des parts.
- Tableau en lignes : marqueur, nom, « x % du total », total, variation vs année précédente (↓ `positive`, ↑ `negative`). Toucher → 05.

## 21 · Dépenses fixes — `21-FixedExpenses.png`
- Retour « Accueil », « + » (ajouter un prélèvement).
- Carte : total mensuel, annualisé, nombre de prélèvements, part du budget.
- « Échéancier de <mois suivant> » : date (jour + mois), nom, catégorie ou échéance proche (`warning`, « dans n jours · rappel J-3 »), montant. Balayage : Modifier / Supprimer.

## 22 · Réglages — `22-Settings.png`
- Barre d'onglets masquée. Carte compte (nom, serveur, heure de dernière synchro).
- Budget : Budget mensuel, Plafond hebdomadaire, Dépenses fixes (→ 21).
- Données : Catégories (→ 06), Notifications (→ 10), Exporter (CSV, feuille de partage native).
- Sécurité : Face ID, Verrouillage auto (immédiat, 1 min, 5 min), Masquer les montants.
- Apparence : Système / Clair / Sombre.
- Pied : version de l'app.

## 23 · Nouvelle / modifier catégorie (sheet) — `23-CategoryEdit.png`
- Annuler, titre, champ Nom (focus `accent`).
- Couleur : grille de 10 teintes PFA (pas de violet), sélection = double anneau.
- « Libellés reconnus automatiquement » : chips supprimables + « + Ajouter » (motifs qui affectent automatiquement une dépense à la catégorie).
- Aperçu du tag. Bouton principal « Créer la catégorie » / « Enregistrer ». En modification : « Supprimer la catégorie » en texte `negative`.

---

## Critères d'acceptation globaux
- Chaque écran correspond à sa maquette en clair et en sombre (écarts ≤ 2 pt), sur iPhone 15/16 et un Pixel récent.
- Aucune couleur/taille en dur hors `tokens.ts` ; aucun violet ; aucun montant hors Geist Mono.
- Navigation : onglets conservent leur pile ; « + » accessible depuis tous les onglets ; retour système Android correct ; sheets fermables par glissement.
- VoiceOver/TalkBack : tous les contrôles nommés ; ordre de lecture logique ; montants lus correctement.
- Hors ligne : ajout possible, file rejouée au retour du réseau, bandeau visible.
- Démarrage à froid < 2 s sur appareil récent ; listes fluides (FlashList si > 100 lignes).
