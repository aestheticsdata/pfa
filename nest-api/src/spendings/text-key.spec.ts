import { keyDistance, textKey } from "@spendings/text-key";

/** PFA-218/219 — one key per spelling, OCR near misses tolerated. Invented text. */
describe("text-key", () => {
  it("keys a text without case, accents or punctuation", () => {
    expect(textKey("  Épicerie du Parc. ")).toBe("EPICERIE DU PARC");
    expect(textKey("Le Fournil — Saint-Jean")).toBe("LE FOURNIL SAINT JEAN");
  });

  it("forgives an OCR typo or two, not a different text", () => {
    expect(keyDistance("EPICERIE DU PAPC", "EPICERIE DU PARC")).toBe(1);
    expect(keyDistance("LE FOURNIL DU PORT", "LE FOURNIL")).toBeNull();
    expect(keyDistance("", "LE FOURNIL")).toBeNull();
  });
});
