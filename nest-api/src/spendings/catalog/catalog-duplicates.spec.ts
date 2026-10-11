import { markDuplicates, sameProductType, sameStore } from "@spendings/catalog/catalog-duplicates";

/** PFA-224 — likely duplicates among the user's stores and product types. Invented names. */
describe("markDuplicates", () => {
  const store = (ID: string, name: string, address: string | null, uses = 1) => ({
    ID,
    name,
    address,
    uses,
    duplicateOf: null,
  });
  const type = (ID: string, name: string, uses = 1) => ({ ID, name, uses, duplicateOf: null });

  it("points a store saved without its address to the one with it, the most used kept", () => {
    const entries = [store("a", "MARCHE EXPRESS", null), store("b", "Marché Express", "4 rue des Lilas", 5)];
    expect(markDuplicates(entries, sameStore).map((entry) => entry.duplicateOf)).toEqual(["b", null]);
  });

  it("keeps two shops of one chain apart, and reads a typo in the address as the same", () => {
    const entries = [
      store("a", "Marché Express", "4 rue des Lilas, 00001 VILLE", 3),
      store("b", "Marché Express", "18 avenue du Port, 00002 BOURG"),
      store("c", "Marche Expres", "4 rue des Lila, 00001 VILLE"),
    ];
    expect(markDuplicates(entries, sameStore).map((entry) => entry.duplicateOf)).toEqual([null, null, "a"]);
  });

  it("reads an abbreviated or misspelt type as the same, never a longer product", () => {
    const entries = [
      type("a", "Savon liquide", 4),
      type("b", "Savon liq."),
      type("c", "Savon liqide"),
      type("d", "Savon"),
    ];
    expect(markDuplicates(entries, sameProductType).map((entry) => entry.duplicateOf)).toEqual([null, "a", "a", null]);
  });

  it("never chains: an entry others merge into points nowhere", () => {
    const entries = [type("a", "Pain", 2), type("b", "Pains", 1)];
    expect(markDuplicates(entries, sameProductType)).toMatchObject([{ duplicateOf: null }, { duplicateOf: "a" }]);
  });
});
