import { closestStore, storeKey } from "@spendings/stores/store-name";

/** PFA-218 — one store per spelling, OCR near misses included. Invented names. */
describe("store-name", () => {
  it("keys a name without case, accents or punctuation", () => {
    expect(storeKey("  Épicerie du Parc. ")).toBe("EPICERIE DU PARC");
    expect(storeKey("Le Fournil — Saint-Jean")).toBe("LE FOURNIL SAINT JEAN");
  });

  describe("closestStore", () => {
    const stores = [
      { ID: "s1", name: "Épicerie du Parc" },
      { ID: "s2", name: "Le Fournil" },
    ];

    it("finds the same store under another spelling", () => {
      expect(closestStore("EPICERIE DU PARC", stores)).toEqual(stores[0]);
    });

    it("forgives an OCR typo or two", () => {
      expect(closestStore("EPICERIE DU PAPC", stores)).toEqual(stores[0]);
    });

    it("leaves a different store alone", () => {
      expect(closestStore("LE FOURNIL DU PORT", stores)).toBeNull();
      expect(closestStore("", stores)).toBeNull();
    });
  });
});
