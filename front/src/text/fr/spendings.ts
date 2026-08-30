const spendings = {
  noCategory: "sans catégorie",
  actions: {
    cancel: "Annuler",
    confirm: "Confirmer",
  },
  dashboard: {
    weeklyStats: {
      headerTitle: "totaux par période",
      weeklyCeiling: "plafond hebdomadaire",
      weeklySpendings: "dépenses moyennes hebdomadaires",
    },
    monthlyBudget: {
      initialAmount: "Montant initial",
      remaining: "Restant",
      total: "Total du mois",
      percentLabel: "dépensés",
    },
    monthlyCharts: {
      headerTitle: "répartition mensuelle",
    },
    weeklyCharts: {
      headerTitle: "répartition hebdomadaire",
    },
    recurrings: {
      show: "Afficher les récurrents",
      hide: "Masquer les récurrents",
    },
  },
  dayItem: {
    remainingBudget: "Budget du jour maximum",
  },
  dayCard: {
    noResults: "Aucun résultat",
    total: "TOTAL",
    addSpending: "Ajouter une dépense ce jour",
  },
  list: {
    empty: "Aucune dépense",
  },
  sortItem: {
    label: "Label",
    category: "Catégories",
    amount: "Montant",
  },
  filter: {
    label: "Filtrer",
    all: "Toutes",
    // Caret at the end of the one-line category strip; opens the full list overlay.
    showAllAria: "Afficher toutes les catégories",
  },
  toolbar: {
    // Week-scoped client-side filter — distinct from the whole-history search
    // (COS-118), which lives next to it and opens the search modal.
    searchPlaceholder: "Filtrer la semaine…",
  },
  view: {
    newSpending: "Nouvelle dépense",
  },
  breakdown: {
    title: "Répartition par catégorie",
    expandAria: "Afficher le détail par catégorie",
    collapseAria: "Masquer le détail par catégorie",
    expandHint: "Déplier pour voir le détail",
    // Label of the stacked bar as a whole — the per-category detail is read from
    // the list below it.
    barAria: "Répartition hebdomadaire par catégorie",
    // Suffix appended after the week range label in the pane header.
    rangeSuffix: " · semaine",
    // Per-category trend badge vs the previous week (COS-35).
    trendStable: "stable",
    trendNew: "nouv.",
  },
  summary: {
    remaining: "Budget restant",
    weekTotal: "Total semaine",
    transactions: "Transactions",
    transactionsSub: (perDay: string) => `sur 7 jours · ${perDay}/jour`,
    avgPerDay: "Moyenne / jour",
    biggest: "Plus grosse",
    overCeiling: (amount: number) => `+${amount} € vs plafond`,
    underCeiling: (amount: number) => `−${amount} € sous plafond`,
    ceilingUndefined: "plafond non défini",
    deltaStable: "stable vs sem. dernière",
    deltaUp: (amount: number) => `+${amount} € vs sem. dernière`,
    deltaDown: (amount: number) => `−${amount} € vs sem. dernière`,
  },
  modal: {
    title: {
      edit: (recurring: boolean) => `Modifier la dépense${recurring ? " fixe" : ""}`,
      create: (recurring: boolean) => `Nouvelle dépense${recurring ? " fixe" : ""}`,
    },
    submit: {
      save: "Enregistrer",
      add: "Ajouter la dépense",
    },
    recurringToggle: "Récurrente mensuelle",
    attachReceipt: "Joindre un reçu",
    fileSize: {
      bytes: "o",
      kilobytes: "Ko",
      megabytes: "Mo",
    },
    copyPreviousMonth: "Copier les dépenses fixes du mois précédent",
    fields: {
      amount: "Montant",
      category: "Catégorie",
      date: "Date",
      label: "Label",
      labelPlaceholder: "Ex : Boulangerie du coin",
    },
    category: {
      triggerEmpty: "Aucune",
      searchPlaceholder: "Rechercher ou saisir…",
      commandEmpty: "Aucune catégorie.",
      clearOption: "Aucune catégorie",
      frequent: "Fréquentes",
    },
    date: {
      prevDayAria: "Jour précédent",
      nextDayAria: "Jour suivant",
    },
    receipt: {
      dropPrompt: "Glisser un reçu ou",
      browse: "parcourir",
      fileTypes: "jpg, png, webp",
      removeAria: "Retirer le reçu",
    },
    validation: {
      labelRequired: "Label requis",
      amountRequired: "Montant requis",
    },
  },
  item: {
    deleteConfirm: "Supprimer cette dépense ?",
    actions: {
      edit: "Modifier",
      delete: "Supprimer",
    },
  },
  txRow: {
    deleteAria: "Confirmer la suppression",
    receiptAttachedAria: "reçu joint",
    viewReceipt: "Voir le reçu",
    addReceipt: "Ajouter un reçu",
  },
  invoiceModal: {
    noInvoice: "Aucune facture",
    fileTooBig: "Le fichier est trop gros",
    chooseFile: "Choisir un fichier",
    fileTypeWarning: "(jpg, png, webp, gif)",
    invalidFileType: "Le fichier n'est pas une image valide",
    send: "Envoyer",
    delete: "Supprimer la facture",
    enlargeAria: "Agrandir la facture",
    imageAlt: "facture",
    previewAlt: "aperçu de la facture",
    deleteConfirmTitle: "Supprimer la facture ?",
    lightboxTitle: "Facture — aperçu",
  },
  spendingsListModal: {
    total: "total",
    filter: "filtrer",
    searchPlaceholder: "Rechercher…",
    noCategoryLabel: "sans catégorie",
    dayTotal: "Total jour",
    cumulativeTotal: "Total cumulé",
    weekWord: "de la semaine",
    monthWord: "du mois",
    seeWeek: "Voir la semaine concernée",
    noSpendings: "Aucune dépense pour cette catégorie.",
    noMatch: "Aucune dépense ne correspond.",
    close: "Fermer",
    // Breakdown of the category by label pattern (PFA-168). "Autres" is the
    // catch-all bucket: the labels that match no pattern, plus the folded tail.
    patterns: {
      title: "répartition par motif",
      other: "Autres",
      showAll: "Tout afficher",
      showLess: "Réduire",
    },
  },
  // One key per action: injecting a participle into a sentence template does
  // not survive translation (gender/agreement, word order).
  toasts: {
    spendingCreated: "dépense créée",
    spendingUpdated: "dépense mise à jour",
    spendingDeleted: "dépense supprimée",
    recurringCreated: "dépense fixe créée",
    recurringUpdated: "dépense fixe mise à jour",
    recurringDeleted: "dépense fixe supprimée",
    recurringsCopied: "dépenses fixes créées",
    receiptUploadFailed: "reçu non joint — réessayer depuis la ligne de la dépense",
  },
};

export default spendings;
