const common = {
  deletePopin: {
    confirmLabel: "Confirmer la suppression ?",
    cancel: "Annuler",
    delete: "Supprimer",
  },
  actions: {
    add: "Ajouter",
    cancel: "Annuler",
    confirm: "Confirmer",
    create: "Créer",
    delete: "Supprimer",
    edit: "Modifier",
    remove: (name: string) => `Retirer ${name}`,
    save: "Enregistrer",
  },
  confirmDelete: {
    description: "Cette action est irréversible.",
  },
  export: {
    label: "Exporter",
    toastTitle: "Export à venir",
    toastDescription: "Bientôt disponible.",
  },
  // Generic toast for a failed mutation that has no dedicated message (PFA-242).
  mutationFailed: "L'opération a échoué. Réessayer.",
  datePicker: {
    prevWeek: "Semaine précédente",
    nextWeek: "Semaine suivante",
    prevMonth: "Mois précédent",
    nextMonth: "Mois suivant",
    placeholder: "Sélectionner une période",
  },
  category: {
    uncategorized: "sans catégorie",
  },
  validation: {
    /** Shared by every bounded text field — the bound comes from its DB column (COS-180). */
    tooLong: (max: number) => `${max} caractères maximum`,
  },
  loading: "Chargement…",
  searchPlaceholder: "Rechercher…",
  optional: "(optionnel)",
};

export default common;
