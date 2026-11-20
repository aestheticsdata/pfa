/** A share kept within 0 → 1; anything that is not a finite number counts as 0. */
export const clampRatio = (ratio: number) => (Number.isFinite(ratio) ? Math.min(1, Math.max(0, ratio)) : 0);
