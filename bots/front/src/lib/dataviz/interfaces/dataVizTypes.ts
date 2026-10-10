// data-viz lib (copied from PFA, PFA-127) — shared data contracts.
// Generic on purpose ({ label, value, color }) so any consumer can use it.

export interface Segment {
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
  /** Render the line dashed (e.g. a target). */
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

/** One column of a stacked column chart: its parts, bottom first. */
export interface StackedColumn {
  key: string;
  parts: Segment[];
}
