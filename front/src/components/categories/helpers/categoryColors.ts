/**
 * Category colors — the design uses a hue-only system oklch(0.80 0.09 <hue>).
 * The backend stores colors as hex strings, so we expose the 12 palette hues
 * converted to hex (via canvas → sRGB, like the design mockup) plus a helper to
 * normalize any CSS color (oklch/hex) to hex for the native color input.
 */

/** Neutral grey used when a category has no colour (or a colour fails to resolve). */
export const CATEGORY_FALLBACK = "#94a3b8";

export const PALETTE_HUES = [5, 25, 60, 80, 110, 140, 175, 210, 250, 290, 320, 350] as const;

export const catColorOklch = (hue: number): string => `oklch(0.80 0.09 ${hue})`;

let sharedCtx: CanvasRenderingContext2D | null | undefined;

const getCtx = (): CanvasRenderingContext2D | null => {
  if (sharedCtx !== undefined) return sharedCtx;
  if (typeof document === "undefined") {
    sharedCtx = null;
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  sharedCtx = canvas.getContext("2d");
  return sharedCtx;
};

/** Convert any CSS color (oklch, hex, rgb…) to #rrggbb. Falls back to grey. */
export const cssColorToHex = (css: string): string => {
  if (/^#[0-9a-fA-F]{6}$/.test(css)) return css.toLowerCase();
  const ctx = getCtx();
  if (!ctx) return CATEGORY_FALLBACK;
  ctx.fillStyle = "#000000";
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
};

/** The 12 palette hues as hex (computed once, client-side). */
export const paletteHex = (): string[] => PALETTE_HUES.map((hue) => cssColorToHex(catColorOklch(hue)));
