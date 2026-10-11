/** Rounds to the whole currency unit. */
export const roundCurrency = (n: number): number => Math.round(n);

/** Rounds to the cent, killing the float noise of summed Prisma Decimals. */
export const round2 = (n: number): number => Math.round(n * 100) / 100;
