import { CatalogName } from "@contexts/price-comparison/domain/catalog-name";

describe("CatalogName", () => {
  it("keeps the trimmed text and keys it without accents or punctuation", () => {
    const name = CatalogName.of("  Épicerie du Parc. ", 40);
    expect([name.text, name.key]).toEqual(["Épicerie du Parc.", "EPICERIE DU PARC"]);
  });

  it("is cut to its column", () => {
    expect(CatalogName.of("Savon liquide", 5).text).toBe("Savon");
  });

  it("is blank when only punctuation is left", () => {
    expect(CatalogName.of(" .. ", 40).isBlank()).toBe(true);
  });
});
