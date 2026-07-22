// pfa data-viz lib — cartesian line & area SVG path builders (pure, no React).
// Consume pixel-space points (already scaled — see scales.ts) and emit `d`
// attribute strings for line, smoothed-line and filled-area series.

import type { LinePoint } from "@lib/dataviz/dataVizTypes";

/** Polyline `M/L` path through pixel-space points. */
export const linePath = (pts: LinePoint[]): string =>
  pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

/**
 * Smooth `M/C` path through pixel-space points: a uniform Catmull-Rom spline
 * converted to cubic béziers (tension 1/6). The curve passes exactly through
 * every input point, with the first/last tangents clamped so it never overshoots
 * past the endpoints. Fewer than 3 points can only form a line, so it degrades
 * to `linePath`. Used for the projection series, which reads better as a gentle
 * curve than the angular polyline used for real data (COS-27).
 */
export const smoothPath = (pts: LinePoint[]): string => {
  if (pts.length < 3) return linePath(pts);
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }
  return d;
};

/**
 * Closed area path: the line, dropped to `baseY`, closed back to the start.
 * `smooth` makes the top edge follow `smoothPath` so a smoothed series' fill
 * hugs its stroke instead of the angular polyline (COS-160).
 */
export const areaPath = (pts: LinePoint[], baseY: number, smooth = false): string => {
  if (pts.length === 0) return "";
  return `${smooth ? smoothPath(pts) : linePath(pts)} L ${pts[pts.length - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`;
};
