/** A slip's horizontal extent in the receipt photo, in pixels: [start, end). */
export interface SlipBounds {
  start: number;
  end: number;
}

/** A single-channel image as raw bytes, one per pixel, row after row. */
export interface GrayImage {
  data: Buffer;
  width: number;
  height: number;
}
