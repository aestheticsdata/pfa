const spendingSearch = {
  trigger: "Rechercher une dépense",
  shortcutHint: "⌘K",
  title: "Rechercher une dépense",
  placeholder: "Rechercher une dépense…",
  hint: "Saisir au moins 2 caractères ou choisir une année",
  yearsAll: "Toutes",
  loading: "Recherche…",
  loadingMore: "Chargement…",
  error: "La recherche a échoué. Réessayer.",
  noResults: "Aucune dépense ne correspond",
  resultsCount: (n: number) => `${n} résultat${n > 1 ? "s" : ""}`,
};

export default spendingSearch;
