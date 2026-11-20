import { ProductTypesService } from "@contexts/price-comparison/application/product-types.service";
import {
  ProductTypeExists,
  ProductTypeInUse,
  ProductTypeSelfMerge,
} from "@contexts/price-comparison/domain/catalog-errors";
import { InMemoryProductTypeRepository } from "@contexts/price-comparison/infrastructure/testing/in-memory-catalog";

/** PFA-219/224 — the user's generic products: resolved by key, renamed, merged, deleted. */
describe("ProductTypesService", () => {
  const owner = "user-1";
  const makeService = (uses = 0) => {
    const types = new InMemoryProductTypeRepository([
      { ID: "t-1", ownerId: owner, name: "Savon liquide", nameKey: "SAVON LIQUIDE", uses },
      { ID: "t-2", ownerId: owner, name: "Pain", nameKey: "PAIN", uses: 0 },
    ]);
    return { service: new ProductTypesService(types), types };
  };

  it("resolves names by key, creating each new one once", async () => {
    const { service, types } = makeService();

    const ids = await service.resolve(["pain", "Thé vert", "THE VERT!", "  "], owner);

    expect([...ids.entries()]).toEqual([
      ["PAIN", "t-2"],
      ["THE VERT", "new:THE VERT"],
    ]);
    expect(types.created).toEqual(["new:THE VERT"]);
  });

  it("renames with the key recomputed, and refuses a name another type bears", async () => {
    const { service } = makeService();

    await expect(service.rename({ id: "t-1", ownerId: owner }, " Savon ")).resolves.toEqual({
      ID: "t-1",
      name: "Savon",
    });
    await expect(service.rename({ id: "t-1", ownerId: owner }, "PAIN")).rejects.toBeInstanceOf(ProductTypeExists);
  });

  it("merges two different types only", async () => {
    const { service, types } = makeService();
    await expect(service.merge("t-1", "t-1", owner)).rejects.toBeInstanceOf(ProductTypeSelfMerge);

    await service.merge("t-1", "t-2", owner);
    expect(types.merges).toEqual([{ sourceId: "t-1", targetId: "t-2", ownerId: owner }]);
  });

  it("deletes only a type no line has", async () => {
    await expect(makeService(3).service.remove({ id: "t-1", ownerId: owner })).rejects.toBeInstanceOf(ProductTypeInUse);
  });

  it("marks a likely duplicate for the management panel", async () => {
    const { service, types } = makeService(5);
    types.types.push({ ID: "t-3", ownerId: owner, name: "Savon liq", nameKey: "SAVON LIQ", uses: 1 });

    const usage = await service.usage(owner);

    expect(usage.find((type) => type.ID === "t-3")?.duplicateOf).toBe("t-1");
  });
});
