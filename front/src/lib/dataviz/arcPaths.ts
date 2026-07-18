// pfa data-viz lib — radial (donut / pie) geometry (pure, no React).
// Polar-coordinate helpers and the wedge path builder used by the Donut chart.

import type { LinePoint } from "@lib/dataviz/dataVizTypes";

/** Angle in degrees (0 = 12 o'clock, clockwise) → point on a circle. */
export const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number): LinePoint => {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};

/**
 * Filled pie-wedge path from `startAngle` to `endAngle` (degrees, clockwise).
 * NOTE: this is the canonical `describeArc` pattern — the arc endpoints are
 * intentionally computed from the *opposite* angles and drawn with sweep-flag 0.
 * With `polarToCartesian` measuring clockwise from 12 o'clock, this renders the
 * correct [startAngle, endAngle] wedge (do not "simplify" the angle swap).
 */
export const wedgePath = (cx: number, cy: number, r: number, startAngle: number, endAngle: number): string => {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
};
