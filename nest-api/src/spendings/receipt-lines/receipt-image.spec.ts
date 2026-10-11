import { findSlips, flattenLighting, inkPerColumn } from "@spendings/receipt-lines/receipt-image";

/** PFA-216 — slips cut on blank bands, shadows divided out. Invented pixel data. */
describe("receipt-image", () => {
  describe("flattenLighting", () => {
    it("whitens shadowed paper and keeps print dark", () => {
      // paper in shadow (120 on a 120 background), print (40 on the same background)
      const flat = flattenLighting(
        { data: Buffer.from([120, 40, 250]), width: 3, height: 1 },
        Buffer.from([120, 120, 250]),
      );
      expect([...flat.data]).toEqual([255, 85, 255]);
    });
  });

  describe("inkPerColumn", () => {
    it("counts the dark pixels of each column", () => {
      const image = { data: Buffer.from([0, 255, 0, 0, 255, 255]), width: 3, height: 2 };
      expect(inkPerColumn(image)).toEqual([2, 0, 1]);
    });
  });

  describe("findSlips", () => {
    const columns = (...runs: [number, number][]) =>
      runs.flatMap(([value, count]) => new Array<number>(count).fill(value));

    it("cuts two slips apart on the blank band between them", () => {
      const ink = columns([0, 50], [40, 400], [0, 100], [40, 300], [0, 150]);
      expect(findSlips(ink, 1000)).toEqual([
        { start: 50, end: 450 },
        { start: 550, end: 850 },
      ]);
    });

    it("keeps one slip whole across the narrow gaps between its own columns", () => {
      const ink = columns([40, 200], [0, 10], [40, 200], [0, 600]);
      expect(findSlips(ink, 1000)).toEqual([{ start: 0, end: 410 }]);
    });

    it("drops a thin inked band such as a paper edge", () => {
      const ink = columns([40, 10], [0, 100], [40, 500]);
      expect(findSlips(ink, 1000)).toEqual([{ start: 110, end: 610 }]);
    });

    it("falls back to the whole width when nothing reads as ink", () => {
      expect(findSlips(columns([0, 300]), 1000)).toEqual([{ start: 0, end: 300 }]);
    });
  });
});
