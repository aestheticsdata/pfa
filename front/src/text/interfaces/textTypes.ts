import type { fr } from "@text/index";

/** Every UI text zone, shaped by the French dictionary that the English one must match. */
export type Dictionary = typeof fr;
export type TextZone = keyof Dictionary;
