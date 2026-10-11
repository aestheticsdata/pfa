import type frPrices from "@text/fr/prices";

const prices: typeof frPrices = {
  title: "Prices",
  subtitle: "What each store charges for the same type of product, per kilo, litre or piece.",
  typesTitle: "Product types",
  typeMeta: (stores: number, purchases: number) =>
    `${stores} store${stores > 1 ? "s" : ""} · ${purchases} purchase${purchases > 1 ? "s" : ""}`,
  empty: "No prices to compare yet: read a receipt, pick its store and give its lines a product type.",
  basis: {
    kg: "Per kilo",
    l: "Per litre",
    piece: "Per piece",
  },
  per: {
    kg: "€/kg",
    l: "€/L",
    piece: "€/piece",
  },
  pieceNote: "No size known: compared per piece, never per kilo or litre.",
  singleStore: "Bought in one store so far: the comparison fills in with the next receipts.",
  cheapest: "Cheapest",
  average: (price: string, unit: string) => `avg. ${price} ${unit}`,
  purchases: (count: number) => `${count} purchase${count > 1 ? "s" : ""}`,
  lastPaid: "Last purchase",
  sizeUnits: { g: "g", kg: "kg", ml: "ml", cl: "cl", l: "L" },
  history: {
    title: "Price over time",
    aria: (basis: string) => `Price over time ${basis}, by store`,
    hint: "Hover a point for the purchase",
    others: (count: number) => `${count} more store${count > 1 ? "s" : ""} not drawn`,
  },
  bulk: {
    title: "Past receipts",
    candidates: (count: number) =>
      count > 1 ? `${count} saved receipts not read yet` : "1 saved receipt not read yet",
    start: "Read them",
    reading: (done: number, total: number) => `Reading receipts… ${done} / ${total}`,
    readingHint: "One receipt at a time, in the background: the page can be left.",
    review: (count: number) => `Review (${count})`,
    reviewHint: "Nothing is saved unreviewed: each read receipt waits to be saved or skipped.",
    failed: (count: number) => (count > 1 ? `${count} unreadable receipts` : "1 unreadable receipt"),
  },
  loadFailed: "Comparison unavailable",
};

export default prices;
