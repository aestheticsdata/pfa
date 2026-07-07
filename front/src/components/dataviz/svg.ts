// pfa data-viz lib — pure SVG geometry helpers (no React, no side effects).

import type { LinePoint } from "@components/dataviz/types";

/** Angle in degrees (0 = 12 o'clock, clockwise) → point on a circle. */
export const polarToCartesian = (
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): LinePoint => {
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
export const wedgePath = (
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string => {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
};

/** Coerce a number[] | LinePoint[] into LinePoint[] (index as x for numbers). */
export const normalizePoints = (
  points: LinePoint[] | number[],
): LinePoint[] =>
  points.map((p, i) => (typeof p === "number" ? { x: i, y: p } : p));

/** [min, max] of a numeric list, guarded against empty / flat inputs. */
export const extent = (values: number[]): [number, number] => {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === Infinity) return [0, 1];
  if (min === max) return [min, min + 1];
  return [min, max];
};

/** Linear scale factory: maps a domain onto a pixel range. */
export const linearScale =
  (domainMin: number, domainMax: number, rangeMin: number, rangeMax: number) =>
  (v: number): number =>
    domainMax === domainMin
      ? rangeMin
      : rangeMin +
        ((v - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin);

/** Polyline `M/L` path through pixel-space points. */
export const linePath = (pts: LinePoint[]): string =>
  pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

/** Closed area path: the line, dropped to `baseY`, closed back to the start. */
export const areaPath = (pts: LinePoint[], baseY: number): string => {
  if (pts.length === 0) return "";
  return `${linePath(pts)} L ${pts[pts.length - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`;
};
