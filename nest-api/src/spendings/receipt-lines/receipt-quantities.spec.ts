import {
  readQuantityDetail,
  readSize,
  splitColumns,
  splitLeadingCount,
} from "@spendings/receipt-lines/receipt-quantities";

/** PFA-219 — what a unit price needs, read on invented receipt text. */
describe("receipt-quantities", () => {
  describe("readSize", () => {
    it.each([
      ["SAVON LIQUIDE 1L", { size: 1, unit: "l" }],
      ["JUS POMME 1,5 L", { size: 1.5, unit: "l" }],
      ["CREME 20CL", { size: 20, unit: "cl" }],
      ["GEL DOUCHE 500ML", { size: 500, unit: "ml" }],
      ["CAFE MOULU 250G", { size: 250, unit: "g" }],
      ["RIZ 1KG", { size: 1, unit: "kg" }],
      ["NOIX 200 GR", { size: 200, unit: "g" }],
      ["EAU GAZEUSE 6X1L", { size: 6, unit: "l" }],
      ["YAOURT 4 X 125G", { size: 500, unit: "g" }],
    ])("%s", (label, expected) => {
      expect(readSize(label)).toEqual(expected);
    });

    it.each(["BANANE SECHEE", "TVA 5.5%", "PILES LR6", "FILM 35MM"])("%s has no size", (label) => {
      expect(readSize(label)).toBeNull();
    });
  });

  describe("splitColumns", () => {
    it("reads a count and unit price that make the total", () => {
      expect(splitColumns("NAT KARITE 1L  4  5,99", 23.96)).toEqual({ label: "NAT KARITE 1L", quantity: 4 });
    });

    it("drops columns that don't add up, keeping a count of one", () => {
      expect(splitColumns("FLACON 500ML  3  4,10", 12.6)).toEqual({ label: "FLACON 500ML", quantity: 1 });
      expect(splitColumns("LOTION  2", 5)).toEqual({ label: "LOTION", quantity: 1 });
    });

    it("leaves a label without columns as it is", () => {
      expect(splitColumns("CAFE MOULU 250G", 3.85)).toEqual({ label: "CAFE MOULU 250G", quantity: 1 });
    });
  });

  describe("splitLeadingCount", () => {
    it("takes a count off the front of a label", () => {
      expect(splitLeadingCount("2 FIGUES SECHEES")).toEqual({ label: "FIGUES SECHEES", quantity: 2 });
    });

    it("leaves a label starting with a word", () => {
      expect(splitLeadingCount("FIGUES 2")).toEqual({ label: "FIGUES 2", quantity: 1 });
    });
  });

  describe("readQuantityDetail", () => {
    it("reads a count line", () => {
      expect(readQuantityDetail("  3 x 1,10           3,30")).toEqual({ quantity: 3, unitPrice: 1.1, weight: null });
    });

    it("reads a weight line as one item of that weight", () => {
      expect(readQuantityDetail("0,512 kg x 3,99 €/kg    2,04")).toEqual({
        quantity: 1,
        unitPrice: 3.99,
        weight: { size: 0.512, unit: "kg" },
      });
    });

    it("is null for anything else", () => {
      expect(readQuantityDetail("12,60 EUR")).toBeNull();
      expect(readQuantityDetail("1,5 x 2,00")).toBeNull();
    });
  });
});
