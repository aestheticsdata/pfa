/**
 * Largest amount a money column holds: every one is a `DECIMAL(10, 2)` (PFA-259).
 * Bounded in the DTOs so an out-of-range amount is a 400 with a message, never a
 * MariaDB out-of-range error surfacing as a 500.
 *
 * The front mirrors it in `front/src/schemas/fieldLimits.ts` (`MAX_AMOUNT`).
 */
export const MAX_AMOUNT = 99_999_999.99;
