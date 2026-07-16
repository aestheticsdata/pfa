const categories = {
  title: "Catégories",
  newCategory: "Nouvelle catégorie",
  list: {
    searchPlaceholder: "Rechercher une catégorie…",
    subtitle: "Gérer les catégories · part et fréquence",
    subtitleStrong: "sur tout l'historique",
    empty: "Aucune catégorie ne correspond.",
    toastCreatedLocal: "Catégorie créée en local (mock — non enregistrée)",
  },
  form: {
    editTitle: "Modifier la catégorie",
    nameLabel: "Nom",
    namePlaceholder: "Nom de la catégorie",
    colorLabel: "Couleur",
    swatchAriaLabel: (hex: string) => `Teinte ${hex}`,
    customLabel: "Personnalisée",
    customColorAriaLabel: "Couleur personnalisée",
    errorNameRequired: "Le nom est requis.",
    errorAlreadyExists: "Cette catégorie existe déjà.",
    cancel: "Annuler",
    submitCreate: "Créer",
    submitEdit: "Enregistrer",
  },
  item: {
    editAction: "Modifier le nom et la couleur",
    deleteAction: "Supprimer la catégorie",
    neverUsed: "nouvelle catégorie · jamais utilisée",
    deleteConfirmTitle: (name: string) => `Supprimer la catégorie « ${name} » ?`,
    deleteConfirmDescription: "Cette action est irréversible. Les dépenses associées n'auront plus de catégorie.",
  },
};

export default categories;
