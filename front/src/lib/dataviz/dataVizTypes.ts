// pfa data-viz lib — shared data contracts.
// Generic on purpose ({ label, value, color }) so any consumer can use it, with
// thin project adapters (see adapters.ts) mapping our API shapes onto these.

export interface DonutSegment {
  label?: string;
  value: number;
  color: string;
}

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

export interface LinePoint {
  x: number;
  y: number;
}

export interface LineSeries {
  /** Either explicit points, or a bare number[] where x = array index. */
  points: LinePoint[] | number[];
  color?: string;
  /** Fill the area under the line. */
  area?: boolean;
  /** Render the line dashed (e.g. a projection). */
  dashed?: boolean;
  /** Draw the stroke as a smooth curve (Catmull-Rom) instead of a polyline. */
  smooth?: boolean;
  /** Stroke width in viewBox units. */
  width?: number;
}

export interface AxisMarker {
  /** Position in data-x units. */
  x: number;
  color?: string;
  label?: string;
}

export interface SeriesDot {
  x: number;
  y: number;
  color?: string;
}

// Interaction contracts — hover state and tooltip data shared by the charts and
// the mouse-following tooltips (CategoryBarTooltip / CursorTooltip).

export type TrendDirection = "up" | "down" | "flat";

export interface CategoryTrendData {
  direction: TrendDirection;
  label: string;
}

/** One category's display data — mirrors its list row. */
export interface CategoryTooltipDatum {
  color: string;
  name: string;
  /** Item count pill. Omit for data that has no count (e.g. the budget donut's
   *  Fixes / Variables segments) — the pill is then hidden. */
  count?: number;
  /** Share of the total, 0-100 (already computed — the tooltip only formats). */
  pct: number;
  /** Amount in euros. */
  total: number;
  /** Trend data — the page computes it from its own source (weekly vs monthly).
   *  Omit for data with no trend — the "Trend" row is then hidden. */
  trend?: CategoryTrendData;
}

/**
 * Local hover state a consumer keeps to drive the category bar tooltip: viewport
 * coords plus the hovered target. `T` is whatever resolves the datum — the row
 * object itself, or its index into a rows array.
 */
export interface BarHover<T> {
  /** Cursor X in viewport coords (clientX). */
  x: number;
  /** Cursor Y in viewport coords (clientY). */
  y: number;
  /** The hovered target (a row, an index, …). */
  target: T;
}

/** Cursor position in viewport coords, driving a mouse-following tooltip. */
export interface CursorPoint {
  /** Cursor X in viewport coords (clientX). */
  x: number;
  /** Cursor Y in viewport coords (clientY). */
  y: number;
}
