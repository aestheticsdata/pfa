import type { GrayImage, SlipBounds } from "@spendings/receipt-lines/interfaces/receiptLinesTypes";

/**
 * Pixel work before the OCR (PFA-216). Pure functions over raw grayscale bytes,
 * so they are tested without an image library.
 */

// After flattening, paper is ~255 and print well below: this separates the two.
const INK_LEVEL = 150;
// A column holds text when ink covers this share of its height; below, it is noise.
const INK_COLUMN_SHARE = 0.004;
// Two slips are apart when this share of the width carries no ink between them.
const SLIP_GAP_SHARE = 0.02;
// Narrower than this share of the width, an inked band is a paper edge, not a slip.
const MIN_SLIP_SHARE = 0.08;

/**
 * Each pixel divided by the local background (the image blurred wide): a
 * shadow over the paper is gone, the print stays dark. `background` is the
 * same image blurred, same size.
 */
export function flattenLighting(image: GrayImage, background: Buffer): GrayImage {
  const data = Buffer.alloc(image.data.length);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.min(255, Math.round((255 * image.data[i]) / Math.max(1, background[i])));
  }
  return { ...image, data };
}

/** How many ink pixels each column of the image holds. */
export function inkPerColumn(image: GrayImage): number[] {
  const ink = new Array<number>(image.width).fill(0);
  for (let y = 0; y < image.height; y++) {
    const row = y * image.width;
    for (let x = 0; x < image.width; x++) {
      if (image.data[row + x] < INK_LEVEL) ink[x]++;
    }
  }
  return ink;
}

/**
 * The slips side by side in the photo — a receipt and its card slip, say — cut
 * on the bands carrying no ink. Read as one page, their lines run into each
 * other and no line ends on its price. One slip: one band, the whole text.
 */
export function findSlips(ink: number[], height: number): SlipBounds[] {
  const width = ink.length;
  const minGap = width * SLIP_GAP_SHARE;
  const bands: SlipBounds[] = [];
  let start = -1;
  let lastInk = -1;

  for (let x = 0; x < width; x++) {
    if (ink[x] <= height * INK_COLUMN_SHARE) continue;
    if (start >= 0 && x - lastInk > minGap) {
      bands.push({ start, end: lastInk + 1 });
      start = -1;
    }
    if (start < 0) start = x;
    lastInk = x;
  }
  if (start >= 0) bands.push({ start, end: lastInk + 1 });

  const slips = bands.filter((band) => band.end - band.start >= width * MIN_SLIP_SHARE);
  return slips.length > 0 ? slips : [{ start: 0, end: width }];
}
