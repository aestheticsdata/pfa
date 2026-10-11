import type { StoreRef } from "@spendings/stores/interfaces/storesTypes";

// An OCR'd name may be off by a letter or two from the store already known:
// within this share of its length, it is that store.
const MAX_TYPO_SHARE = 0.2;

/**
 * The name a store is recognised by (PFA-218): upper-cased, accents dropped,
 * anything but letters and digits as one space. "Épicerie du Parc" and
 * "EPICERIE  DU PARC." are one store.
 */
export function storeKey(name: string): string {
  return name
    .normalize("NFD")
    .replaceAll(/\p{M}/gu, "")
    .toUpperCase()
    .replaceAll(/[^A-Z0-9]+/g, " ")
    .trim();
}

function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const substitution = previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      current.push(Math.min(previous[j] + 1, current[j - 1] + 1, substitution));
    }
    previous = current;
  }
  return previous[b.length];
}

/** The known store a read name stands for — same key, or a near miss — else null. */
export function closestStore(name: string, stores: StoreRef[]): StoreRef | null {
  const key = storeKey(name);
  if (!key) return null;
  let best: { store: StoreRef; distance: number } | null = null;
  for (const store of stores) {
    const distance = editDistance(key, storeKey(store.name));
    if (distance <= Math.floor(key.length * MAX_TYPO_SHARE) && (!best || distance < best.distance)) {
      best = { store, distance };
    }
  }
  return best?.store ?? null;
}
