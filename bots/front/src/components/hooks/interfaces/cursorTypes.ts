/** A pointer position, in viewport pixels. */
export interface CursorPoint {
  x: number;
  y: number;
}

/** The pointer over a chart and what it is over (an index, a bucket…). */
export interface CursorHover<T> extends CursorPoint {
  data: T;
}
