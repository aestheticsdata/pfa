/**
 * MOCK — per-category usage stats (times used + total spent over all history)
 * are not in the API yet. Values are derived deterministically from the name so
 * cards stay stable across renders. Swap for real data when the backend exposes
 * category usage aggregates (see design_handoff README §7).
 */

export interface CategoryUsage {
  /** number of times the category was used (all history) */
  used: number;
  /** total spent on the category, in whole currency units (all history) */
  total: number;
}

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

// MOCK
export const mockCategoryUsage = (name: string): CategoryUsage => {
  const hash = hashString(name.toLowerCase());
  const used = hash % 420; // 0 → "jamais utilisée"
  const total = used === 0 ? 0 : (hash % 14800) + 120;
  return { used, total };
};
