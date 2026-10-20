// Closed value sets of the dataviz components' props (PFA-247).

/** Which way a category's spending moved: up reads red, down green, flat neutral. */
export const TREND_DIRECTION = { up: "up", down: "down", flat: "flat" } as const;

export const DONUT_VARIANT = { ring: "ring", pie: "pie" } as const;

export const BAR_ORIENTATION = { vertical: "vertical", horizontal: "horizontal" } as const;
