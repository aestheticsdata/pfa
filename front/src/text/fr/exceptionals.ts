const exceptionals = {
  filters: {
    label: "Filtre :",
    allYears: "Toutes les années",
    categoryLabel: "Catégorie",
    allCategories: "Toutes",
  },
  actions: {
    add: "Ajouter",
    cancel: "Annuler",
    save: "Enregistrer",
    edit: "Modifier",
    delete: "Supprimer",
  },
  item: {
    budgetMonths: "≈ {months} mois de budget régulier",
    deleteConfirmTitle: (label: string) => `Supprimer ${label} ?`,
  },
  modal: {
    createTitle: "Nouvelle dépense exceptionnelle",
    editTitle: "Modifier la dépense exceptionnelle",
    errors: {
      labelRequired: "Label requis",
      amountRequired: "Montant requis",
      dateRequired: "Date requise",
    },
    fields: {
      date: "Date",
      amount: "Montant (€)",
      label: "Label",
      labelPlaceholder: "Ex : Climatiseur mobile",
      description: "Description",
      optional: "(optionnel)",
      descriptionPlaceholder: "Ex : Ordinateur portable pro",
      category: "Catégorie",
    },
    category: {
      nonePlaceholder: "Aucune",
      searchPlaceholder: "Rechercher ou créer…",
      create: (query: string) => `Créer « ${query} »`,
      empty: "Aucune catégorie.",
      noneItem: "Aucune catégorie",
    },
  },
  stats: {
    totalYear: (year: number) => `Total ${year}`,
    totalAllYears: "Total (toutes années)",
    exceptionalCount: (count: number) =>
      `${count} dépense${count > 1 ? "s" : ""} exceptionnelle${count > 1 ? "s" : ""}`,
    averagePerMonth: "Moyenne / mois",
    smoothedOver: (spanMonths: number) => `lissée sur ${spanMonths} mois`,
    biggest: "Plus grosse dépense",
    partOfSpending: "Part des dépenses",
    spentIn: (total: string, year: number) => `sur ${total} € dépensés en ${year}`,
    unavailable: "indisponible",
  },
  list: {
    empty: "Aucune dépense exceptionnelle.",
    purchaseCount: (count: number) => `${count} dépense${count > 1 ? "s" : ""}`,
    total: "Total",
  },
  toast: {
    created: "dépense exceptionnelle créée",
    updated: "dépense exceptionnelle mise à jour",
    deleted: "dépense exceptionnelle supprimée",
  },
};

export default exceptionals;
