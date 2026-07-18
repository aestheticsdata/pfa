/**
 * Category chip — mono uppercase micro-tag tinted by its own `currentColor`
 * (the category colour, set via an inline `color`/`style`). The `color-mix`
 * fill + border derive from that current colour, so there is no palette token
 * to point at; shared by the Dépenses day-card tags and transaction rows.
 */
export const TAG_CHIP =
  "inline-block rounded-sm border border-[color-mix(in_oklch,currentColor_28%,transparent)] bg-[color-mix(in_oklch,currentColor_15%,transparent)] px-2 py-0.75 font-mono text-2xs font-semibold uppercase leading-normal tracking-wider text-ink-3";
