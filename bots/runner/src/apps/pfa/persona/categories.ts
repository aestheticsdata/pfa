import type { PfaCategory } from "@apps/pfa/interfaces/pfaTypes";

/**
 * The fixed pool of categories bots may use (guardrail: nothing outside it). Names fit PFA's
 * 20-character limit; created on first use through the spending form's implicit path, like a
 * person typing a new category into the combobox.
 */
export const CATEGORIES = {
  groceries: { name: "Groceries", color: "#6DB65B" },
  restaurants: { name: "Restaurants", color: "#E8663D" },
  bars: { name: "Bars", color: "#C2457A" },
  transport: { name: "Transport", color: "#3D8FE8" },
  home: { name: "Home", color: "#B08A4F" },
  health: { name: "Health", color: "#4FB0A5" },
  bills: { name: "Bills", color: "#8A7BD8" },
  leisure: { name: "Leisure", color: "#E8B83D" },
} as const satisfies Record<string, PfaCategory>;
