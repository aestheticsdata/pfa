import { StoresService } from "@contexts/price-comparison/application/stores.service";
import {
  EmptyStoreName,
  StoreExists,
  StoreInUse,
  StoreNotFound,
  StoreSelfMerge,
} from "@contexts/price-comparison/domain/catalog-errors";
import { InMemoryStoreRepository } from "@contexts/price-comparison/infrastructure/testing/in-memory-catalog";

/** PFA-224 — managing the user's stores: rename, merge, delete. Invented stores. */
describe("StoresService", () => {
  const owner = "user-1";
  const makeService = (uses = 0) => {
    const stores = new InMemoryStoreRepository([
      { ID: "s-1", ownerId: owner, name: "Fournil", address: null, nameKey: "FOURNIL", addressKey: "", uses },
      {
        ID: "s-2",
        ownerId: owner,
        name: "Marche Express",
        address: null,
        nameKey: "MARCHE EXPRESS",
        addressKey: "",
        uses: 0,
      },
    ]);
    return { service: new StoresService(stores), stores };
  };

  it("renames with keys recomputed", async () => {
    const { service, stores } = makeService();

    await service.rename({ id: "s-1", ownerId: owner }, { name: " Marché du Coin ", address: "4 rue des Lilas" });

    expect(stores.stores[0]).toMatchObject({
      name: "Marché du Coin",
      nameKey: "MARCHE DU COIN",
      address: "4 rue des Lilas",
      addressKey: "4 RUE DES LILAS",
    });
  });

  it("refuses a rename onto another store, naming it for the merge", async () => {
    const { service } = makeService();

    const renamed = service.rename({ id: "s-1", ownerId: owner }, { name: "MARCHÉ EXPRESS", address: null });

    await expect(renamed).rejects.toBeInstanceOf(StoreExists);
    await expect(renamed).rejects.toMatchObject({ details: { conflictID: "s-2" } });
  });

  it("refuses an empty name and a store of someone else", async () => {
    const { service } = makeService();
    await expect(service.rename({ id: "s-1", ownerId: owner }, { name: " .. ", address: null })).rejects.toBeInstanceOf(
      EmptyStoreName,
    );
    await expect(service.rename({ id: "s-1", ownerId: "other" }, { name: "X", address: null })).rejects.toBeInstanceOf(
      StoreNotFound,
    );
  });

  it("merges only two different stores of the user", async () => {
    const { service, stores } = makeService();
    await expect(service.merge("s-1", "s-1", owner)).rejects.toBeInstanceOf(StoreSelfMerge);
    await expect(service.merge("s-1", "other", owner)).rejects.toBeInstanceOf(StoreNotFound);

    await service.merge("s-1", "s-2", owner);
    expect(stores.merges).toEqual([{ sourceId: "s-1", targetId: "s-2", ownerId: owner }]);
  });

  it("deletes only a store no spending uses", async () => {
    await expect(makeService(2).service.remove({ id: "s-1", ownerId: owner })).rejects.toBeInstanceOf(StoreInUse);

    const { service, stores } = makeService();
    await service.remove({ id: "s-1", ownerId: owner });
    expect(stores.stores.map((store) => store.ID)).toEqual(["s-2"]);
  });

  it("never creates a store with an empty name", async () => {
    await expect(makeService().service.resolve({ name: " - ", address: null }, owner)).resolves.toBeNull();
  });
});
