/**
 * How a name typed by hand or read by the OCR is recognised (PFA-218, PFA-219):
 * stores, their addresses and product types alike.
 */

// A read text may be off by a letter or two from the one already known:
// within this share of its length, it is that one.
const MAX_TYPO_SHARE = 0.2;

/**
 * Upper-cased, accents dropped, anything but letters and digits as one space:
 * "Épicerie du Parc" and "EPICERIE  DU PARC." share a key.
 */
export function textKey(text: string): string {
  return text
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

/** How far two keys are apart, or null when too far to be the same text. */
export function keyDistance(read: string, known: string): number | null {
  if (!read || !known) return null;
  const distance = editDistance(read, known);
  return distance <= Math.floor(read.length * MAX_TYPO_SHARE) ? distance : null;
}
