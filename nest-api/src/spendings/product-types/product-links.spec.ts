import { linkProductTypes, storeKey } from "@spendings/product-types/product-links";

/** PFA-219 — a label typed once comes back typed. Invented stores and labels. */
describe("linkProductTypes", () => {
  const here = { name: "Marché Express", address: "4 rue des Lilas, 00001 VILLE" };
  const elsewhere = { name: "Marché Express", address: "18 avenue du Port, 00002 BOURG" };
  const line = (label: string) => ({ label, amount: 1, quantity: 1, size: null, sizeUnit: null, productType: null });

  it("takes the type given at this store first, then anywhere, newest first", () => {
    const history = [
      { label: "SAVON DOUX 1L", productType: "Savon (autre magasin)", storeKey: storeKey(elsewhere) },
      { label: "savon doux 1l", productType: "Savon liquide", storeKey: storeKey(here) },
      { label: "Savon doux 1L", productType: "Savon ancien", storeKey: storeKey(here) },
      { label: "RIZ BASMATI", productType: "Riz", storeKey: null },
    ];

    const linked = linkProductTypes([line("SAVON DOUX 1L"), line("RIZ BASMATI"), line("PAIN")], history, here);

    expect(linked.map((l) => l.productType)).toEqual(["Savon liquide", "Riz", null]);
  });

  it("keeps a type already set, and links by label alone without a store", () => {
    const typed = { ...line("RIZ BASMATI"), productType: "Riz long" };
    const history = [{ label: "RIZ BASMATI", productType: "Riz", storeKey: null }];

    expect(linkProductTypes([typed], history, null)[0].productType).toBe("Riz long");
    expect(linkProductTypes([line("RIZ BASMATI")], history, null)[0].productType).toBe("Riz");
  });
});
