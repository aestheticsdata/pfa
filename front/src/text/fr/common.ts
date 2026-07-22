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
  datePicker: {
    placeholder: "Sélectionner une période",
  },
  category: {
    uncategorized: "sans catégorie",
  },
  loading: "Chargement…",
  searchPlaceholder: "Rechercher…",
  optional: "(optionnel)",
};

export default common;
