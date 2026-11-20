import type { ChartBox, ChartPoint } from "@charts/interfaces/chartTypes";

/** A linear map from [domainMin, domainMax] to [rangeMin, rangeMax]; a flat domain maps to rangeMin. */
export const linearScale = (domain: readonly [number, number], range: readonly [number, number]) => {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  return (value: number) => (span === 0 ? r0 : r0 + ((value - d0) / span) * (r1 - r0));
};

/**
 * Daily values → points inside the box: day i at x = i (first and last at the edges), the largest
 * value at the top. A month with nothing spent sits on the baseline.
 */
export const toPoints = (values: readonly number[], box: ChartBox): ChartPoint[] => {
  const max = Math.max(0, ...values);
  const x = linearScale([0, Math.max(1, values.length - 1)], [box.left, box.left + box.width]);
  const y = linearScale([0, max], [box.top + box.height, box.top]);
  return values.map((value, index) => ({ x: x(index), y: y(value) }));
};

/** An SVG path through the points, straight segments; "" for no point. */
export const linePath = (points: readonly ChartPoint[]) =>
  points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");

/** The same line closed down to the baseline, for the gradient fill under it. */
export const areaPath = (points: readonly ChartPoint[], baseline: number) => {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return "";
  return `${linePath(points)} L${last.x} ${baseline} L${first.x} ${baseline} Z`;
};

export const average = (values: readonly number[]) =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

/** The index of the point nearest to `x`, for a finger scrubbing the chart. */
export const nearestIndex = (points: readonly ChartPoint[], x: number) => {
  let best = 0;
  points.forEach((point, index) => {
    const current = points[best];
    if (current && Math.abs(point.x - x) < Math.abs(current.x - x)) best = index;
  });
  return best;
};
