const spendings = {
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
    }
  },
  dayItem: {
    recurringTitle: "Dépenses fixes",
    total: "Total",
    remainingBudget: "Budget du jour maximum",
    filterResetLabel: "tout",
  },
  sortItem: {
    label: "Label",
    category: "Catégories",
    amount: "Montant",
  },
  invoiceModal: {
    noInvoice: "Aucune facture",
    fileTooBig: "Le fichier est tros gros",
    chooseFile: "Choisir un fichier",
    fileTypeWarning: "(jpg, png, webp, gif)",
    invalidFileType: "Le fichier n'est pas une image valide",
    send: "Envoyer",
    delete: "Effacer la facture",
  },
  spendingsListModal: {
    total: "total",
    filter: "filtrer",
    noCategoryLabel: "sans catégorie",
    dayTotal: "Total jour",
    cumulativeTotal: "Total cumulé",
    monthPercentage: "(% du mois)",
  },
};

export default spendings;
