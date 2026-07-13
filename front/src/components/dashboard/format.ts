// Shared number formatting for the Dashboard (fr-FR).

export const euro = (n: number) =>
  Number(n).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const euro0 = (n: number) => Math.round(Number(n)).toLocaleString("fr-FR");

export const pct1 = (n: number) => n.toFixed(1).replace(".", ",");
