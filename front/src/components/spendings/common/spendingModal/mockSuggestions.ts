// MOCK — label autocomplete: needs the user's past spending labels, which the
// backend does not expose yet.
// NOTE: the label FILL this drives is REAL — only the suggestion source is fake.
// Deterministic and self-contained so it is trivial to swap for a real endpoint
// later. See REFACTO_NOTES.md §6.
// ("Fréquentes" category ranking is now real — see rankFrequentCategories, COS-22.)

export interface LabelSuggestion {
  label: string;
  category: string;
}

// A small set of common French merchant → category pairs. Stand-in for real
// label history until the API serves it.
const COMMON_LABELS: LabelSuggestion[] = [
  { label: "Monoprix", category: "alimentation" },
  { label: "Franprix", category: "alimentation" },
  { label: "Carrefour", category: "alimentation" },
  { label: "Boulangerie", category: "alimentation" },
  { label: "Uber", category: "transport" },
  { label: "Pharmacie", category: "santé" },
  { label: "Restaurant", category: "restaurant" },
  { label: "Amazon", category: "achats" },
  { label: "Essence", category: "transport" },
  { label: "Abonnement", category: "abonnements" },
];

/**
 * MOCK label recommendations (max 3). With an empty field, returns the top
 * "frequent" recommendations (visible on open, like the maquette); as the user
 * types, filters by the query.
 */
export const mockLabelSuggestions = (query: string): LabelSuggestion[] => {
  const q = query.trim().toLowerCase();
  if (!q) return COMMON_LABELS.slice(0, 3);
  return COMMON_LABELS.filter((s) => s.label.toLowerCase().includes(q) && s.label.toLowerCase() !== q).slice(0, 3);
};
