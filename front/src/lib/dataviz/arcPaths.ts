// pfa data-viz lib — radial (donut / pie) geometry (pure, no React).
// Polar-coordinate helpers and the wedge path builder used by the Donut chart.

import type { AngleSpan, Circle, LinePoint, Ring } from "@lib/dataviz/interfaces/dataVizTypes";

/** Angle in degrees (0 = 12 o'clock, clockwise) → point on a circle. */
export const polarToCartesian = ({ cx, cy, r }: Circle, angleDeg: number): LinePoint => {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};

/**
 * Inverse of {@link polarToCartesian}'s angle: an offset from the center
 * (`dx` right, `dy` down) → its angle in degrees, measured clockwise from
 * 12 o'clock and normalized to [0, 360). Used to hit-test a cursor against
 * the ring's segments (which run clockwise from the top).
 */
export const angleFromCenter = (dx: number, dy: number): number => {
  const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return deg < 0 ? deg + 360 : deg;
};

/**
 * Filled pie-wedge path from `startAngle` to `endAngle` (degrees, clockwise).
 * NOTE: this is the canonical `describeArc` pattern — the arc endpoints are
 * intentionally computed from the *opposite* angles and drawn with sweep-flag 0.
 * With `polarToCartesian` measuring clockwise from 12 o'clock, this renders the
 * correct [startAngle, endAngle] wedge (do not "simplify" the angle swap).
 */
export const wedgePath = (circle: Circle, { startAngle, endAngle }: AngleSpan): string => {
  const { cx, cy, r } = circle;
  const start = polarToCartesian(circle, endAngle);
  const end = polarToCartesian(circle, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
};

/**
 * Closed annular-sector ("ring segment") outline from `startAngle` to `endAngle`
 * (degrees, clockwise from 12 o'clock), between `rInner` and `rOuter`. Traces the
 * band's whole perimeter — outer arc, end cap, inner arc, start cap — so a
 * `fill="none"` stroke draws it as a hollow, see-through band: the Donut's empty
 * "remaining" arc, the same width as the solid arcs but only outlined (dotted).
 * The path length lives in its geometry, leaving `stroke-dasharray` free for the
 * dot pattern.
 */
export const annularSectorPath = ({ cx, cy, rInner, rOuter }: Ring, { startAngle, endAngle }: AngleSpan): string => {
  const outer = { cx, cy, r: rOuter };
  const inner = { cx, cy, r: rInner };
  const oStart = polarToCartesian(outer, startAngle);
  const oEnd = polarToCartesian(outer, endAngle);
  const iEnd = polarToCartesian(inner, endAngle);
  const iStart = polarToCartesian(inner, startAngle);
  const largeArc = endAngle - startAngle > 180 ? "1" : "0";
  return [
    `M ${oStart.x} ${oStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${oEnd.x} ${oEnd.y}`,
    `L ${iEnd.x} ${iEnd.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${iStart.x} ${iStart.y}`,
    "Z",
  ].join(" ");
};
