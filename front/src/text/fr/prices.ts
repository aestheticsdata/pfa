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
  loadFailed: "Comparatif indisponible",
};

export default prices;
