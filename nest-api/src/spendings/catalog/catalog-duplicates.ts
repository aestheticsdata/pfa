import type { CatalogEntry, SameEntry, StoreEntry } from "@spendings/catalog/interfaces/catalogTypes";
import { keyDistance, textKey } from "@spendings/text-key";

// An abbreviated word ("LIQ" for "LIQUIDE") keeps this many letters at least.
const MIN_ABBREVIATION = 3;

/** Two keys within a typo of each other, whichever is read first. */
function nearKeys(a: string, b: string): boolean {
  return keyDistance(a, b) !== null || keyDistance(b, a) !== null;
}

/** "SAVON LIQ" for "SAVON LIQUIDE": as many words, each the start of the other's. */
function abbreviates(short: string, long: string): boolean {
  const shortWords = short.split(" ");
  const longWords = long.split(" ");
  return (
    short !== long &&
    shortWords.length === longWords.length &&
    shortWords.every((word, i) => word.length >= MIN_ABBREVIATION && longWords[i].startsWith(word))
  );
}

/** One store saved twice: near names, and addresses that agree or one of them unknown. */
export const sameStore: SameEntry<StoreEntry> = (a, b) => {
  if (!nearKeys(textKey(a.name), textKey(b.name))) return false;
  const [addressA, addressB] = [textKey(a.address ?? ""), textKey(b.address ?? "")];
  return !addressA || !addressB || nearKeys(addressA, addressB);
};

/** One product spelled two ways: a typo apart, or one abbreviating the other. */
export const sameProductType: SameEntry<CatalogEntry> = (a, b) => {
  const [keyA, keyB] = [textKey(a.name), textKey(b.name)];
  return nearKeys(keyA, keyB) || abbreviates(keyA, keyB) || abbreviates(keyB, keyA);
};

/**
 * Each entry's likely duplicate (PFA-224): the most used entry it stands for,
 * which it would be merged into. An entry others point to points nowhere.
 */
export function markDuplicates<T extends CatalogEntry>(entries: T[], same: SameEntry<T>): T[] {
  const ranked = [...entries].sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name));
  const duplicateOf = new Map<string, string>();
  ranked.forEach((entry, i) => {
    const kept = ranked.slice(0, i).find((other) => !duplicateOf.has(other.ID) && same(entry, other));
    if (kept) duplicateOf.set(entry.ID, kept.ID);
  });
  return entries.map((entry) => ({ ...entry, duplicateOf: duplicateOf.get(entry.ID) ?? null }));
}
