// pfa data-viz lib — value→pixel scales (pure, no React, no side effects).
// The coordinate-system layer: turn raw series data into the numbers the path
// builders (linePaths / arcPaths) draw with.

import type { LinePoint } from "@lib/dataviz/interfaces/dataVizTypes";

/** Coerce a number[] | LinePoint[] into LinePoint[] (index as x for numbers). */
export const normalizePoints = (points: LinePoint[] | number[]): LinePoint[] =>
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
    domainMax === domainMin ? rangeMin : rangeMin + ((v - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin);
