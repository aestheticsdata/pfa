// Price comparison by store per product type (PFA-220).
const prices = {
  title: "Prix",
  subtitle: "Ce que chaque magasin fait payer un même type de produit, au kilo, au litre ou à la pièce.",
  typesTitle: "Types de produit",
  typeMeta: (stores: number, purchases: number) =>
    `${stores} magasin${stores > 1 ? "s" : ""} · ${purchases} achat${purchases > 1 ? "s" : ""}`,
  empty:
    "Aucun prix à comparer pour l'instant : lire un ticket, choisir son magasin et donner un type de produit à ses lignes.",
  basis: {
    kg: "Au kilo",
    l: "Au litre",
    piece: "À la pièce",
  },
  per: {
    kg: "€/kg",
    l: "€/L",
    piece: "€/pièce",
  },
  pieceNote: "Sans contenance connue : comparé à la pièce, jamais au kilo ni au litre.",
  singleStore: "Acheté dans un seul magasin pour l'instant : le comparatif se remplira avec les prochains tickets.",
  cheapest: "Le moins cher",
  average: (price: string, unit: string) => `moy. ${price} ${unit}`,
  purchases: (count: number) => `${count} achat${count > 1 ? "s" : ""}`,
  lastPaid: "Dernier achat",
  sizeUnits: { g: "g", kg: "kg", ml: "ml", cl: "cl", l: "L" },
  history: {
    title: "Évolution du prix",
    aria: (basis: string) => `Évolution du prix ${basis}, par magasin`,
    hint: "Survoler un point pour le détail de l'achat",
    others: (count: number) =>
      `${count} autre${count > 1 ? "s" : ""} magasin${count > 1 ? "s" : ""} non tracé${count > 1 ? "s" : ""}`,
  },
  bulk: {
    title: "Anciens tickets",
    candidates: (count: number) =>
      count > 1 ? `${count} tickets enregistrés pas encore lus` : "1 ticket enregistré pas encore lu",
    start: "Les lire",
    reading: (done: number, total: number) => `Lecture des tickets… ${done} / ${total}`,
    readingHint: "Un ticket à la fois, en arrière-plan : la page peut être quittée.",
    review: (count: number) => `Vérifier (${count})`,
    reviewHint: "Rien n'est enregistré sans vérification : chaque ticket lu attend d'être validé ou passé.",
    failed: (count: number) => (count > 1 ? `${count} tickets illisibles` : "1 ticket illisible"),
  },
  catalog: {
    open: "Magasins et types",
    title: "Magasins et types de produit",
    description: "Renommer, fusionner les doublons, supprimer ce qui ne sert plus.",
    tabs: { stores: "Magasins", productTypes: "Types de produit" },
    empty: { stores: "Aucun magasin enregistré.", productTypes: "Aucun type de produit enregistré." },
    uses: (count: number) => (count === 0 ? "Aucun achat" : `${count} achat${count > 1 ? "s" : ""}`),
    noAddress: "Sans adresse",
    duplicate: (name: string) => `Doublon probable de « ${name} »`,
    rename: "Renommer",
    merge: "Fusionner",
    remove: "Supprimer",
    save: "Enregistrer",
    cancel: "Annuler",
    name: "Nom",
    address: "Adresse",
    conflict: (name: string) => `« ${name} » existe déjà : fusionner plutôt.`,
    mergeInto: (name: string) => `Fusionner dans « ${name} »`,
    mergeTarget: "Garder",
    mergeHint: (name: string, count: number) =>
      `${count > 1 ? `Les ${count} achats` : count === 1 ? "L'achat" : "Rien"} de « ${name} » ${count > 1 ? "passent" : "passe"} sur celui gardé, puis « ${name} » est supprimé.`,
    failed: "Modification impossible",
  },
  loadFailed: "Comparatif indisponible",
};

export default prices;
