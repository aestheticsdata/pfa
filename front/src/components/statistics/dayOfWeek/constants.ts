// Row layout (COS-182). From `md` up: fixed day-name and amount columns around the
// elastic bar column. Below it those two columns would leave the bar a few dozen
// pixels, so the row stacks instead — day name and amount share the first line, the
// bar spans the full width underneath.
const MD_COLS = "md:grid-cols-[92px_1fr_152px]";
export const ROW_GRID = `grid grid-cols-[1fr_auto] items-start gap-x-3 gap-y-1.5 ${MD_COLS} md:items-center md:gap-y-0`;

// Bands that must line up with the bar column alone (the average-line label, the
// budget ticks, the full-height reference lines): full width while the bar is, then
// the middle column from `md` up. `BAND_COLS` carries no `display`, so an overlay
// can turn the band on at a breakpoint without fighting `grid` over one property.
export const BAND_COLS = `grid-cols-1 gap-x-3 ${MD_COLS}`;
export const BAND_GRID = `grid ${BAND_COLS}`;

// How close to an edge the average line has to be for its label to stop being
// centred on it and go flush instead, so the label never overflows the plot.
export const LABEL_EDGE_FRAC = 0.15;

// Fixed-scale headroom so the top marker (2×budget, or the widest whisker) always
// sits inside the plot with a little air past it (COS-132, COS-127).
export const SCALE_HEADROOM = 1.12;

// Compare-year bar + swatch fill: the darker accent green with a light diagonal
// hatch — the same muted-green hatch idiom as the forecast strip, distinct from
// the bright main-bar gradient. Echoes the monthly chart's "comparison" visual
// language (COS-127).
export const COMPARE_FILL =
  "repeating-linear-gradient(45deg, var(--accent-d) 0 3px, color-mix(in oklch, var(--accent-d) 55%, var(--accent-strong)) 3px 6px)";

// Legend colour-band swatch fills, matching the bullet-bar zones.
export const BAND_FILL = { under: "var(--bar-fill)", between: "var(--warn)", over: "var(--neg)" } as const;

// Enter/exit duration (ms) for the compare-year marks collapsing + fading in and
// out when "Compare to" is toggled.
export const COMPARE_ANIM_MS = 280;
