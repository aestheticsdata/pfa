import { recogniseStore } from "@spendings/stores/store-name";

/** PFA-219 — a store is a name and an address. Invented stores. */
describe("recogniseStore", () => {
  const stores = [
    { ID: "s1", name: "Marché Express", address: "4 rue des Lilas, 00001 VILLE" },
    { ID: "s2", name: "Marché Express", address: "18 avenue du Port, 00002 BOURG" },
    { ID: "s3", name: "Le Fournil", address: null },
  ];

  it("picks the shop of that name at that address, typos included", () => {
    expect(recogniseStore({ name: "MARCHE EXPRESS", address: "18 AVENUE DU P0RT, 00002 BOURG" }, stores)).toBe(
      stores[1],
    );
  });

  it("proposes no known store for a known name at a new address", () => {
    expect(recogniseStore({ name: "MARCHE EXPRESS", address: "2 place Neuve, 00003 CITE" }, stores)).toBeNull();
  });

  it("without an address, decides only when one store bears the name", () => {
    expect(recogniseStore({ name: "LE FOURNIL", address: null }, stores)).toBe(stores[2]);
    expect(recogniseStore({ name: "MARCHE EXPRESS", address: null }, stores)).toBeNull();
  });

  it("leaves an unknown name alone", () => {
    expect(recogniseStore({ name: "PRIMEUR DU COIN", address: null }, stores)).toBeNull();
  });
});
