import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { StoresService } from "@spendings/stores/stores.service";

/** PFA-224 — managing the user's stores: rename, merge, delete. Invented stores. */
describe("StoresService management", () => {
  const makeService = (twin: { ID: string } | null = null, inUse = 0) => {
    const owned = new Set(["s-1", "s-2"]);
    const prisma = {
      stores: {
        findFirst: jest.fn(({ where }: { where: { ID?: unknown } }) =>
          Promise.resolve(typeof where.ID === "string" ? (owned.has(where.ID) ? { ID: where.ID } : null) : twin),
        ),
        update: jest.fn(({ data }: { data: Record<string, unknown> }) => Promise.resolve(data)),
        delete: jest.fn((args: unknown) => ({ op: "delete", args })),
      },
      spendings: {
        updateMany: jest.fn((args: unknown) => ({ op: "updateMany", args })),
        count: jest.fn().mockResolvedValue(inUse),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    return { service: new StoresService(prisma as never), prisma };
  };

  it("renames with keys recomputed", async () => {
    const { service, prisma } = makeService();
    await service.rename("s-1", { name: " Marché Express ", address: "4 rue des Lilas" }, "user-1");
    expect(prisma.stores.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: "Marché Express",
          nameKey: "MARCHE EXPRESS",
          address: "4 rue des Lilas",
          addressKey: "4 RUE DES LILAS",
        },
      }),
    );
  });

  it("refuses a rename onto another store, naming it for the merge", async () => {
    const { service, prisma } = makeService({ ID: "s-2" });
    const renamed = service.rename("s-1", { name: "MARCHE EXPRESS", address: null }, "user-1");
    await expect(renamed).rejects.toBeInstanceOf(ConflictException);
    await expect(renamed).rejects.toMatchObject({ response: { conflictID: "s-2" } });
    expect(prisma.stores.update).not.toHaveBeenCalled();
  });

  it("refuses an empty name and a store of someone else", async () => {
    const { service } = makeService();
    await expect(service.rename("s-1", { name: " .. ", address: null }, "user-1")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.rename("other", { name: "Fournil", address: null }, "user-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("merges in one transaction: spendings move, then the source goes", async () => {
    const { service, prisma } = makeService();
    await service.merge("s-1", "s-2", "user-1");
    expect(prisma.spendings.updateMany).toHaveBeenCalledWith({
      where: { storeID: "s-1", userID: "user-1" },
      data: { storeID: "s-2" },
    });
    expect(prisma.stores.delete).toHaveBeenCalledWith({ where: { ID: "s-1" } });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("never merges a store into itself or into one not the user's", async () => {
    const { service, prisma } = makeService();
    await expect(service.merge("s-1", "s-1", "user-1")).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.merge("s-1", "other", "user-1")).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("deletes only a store no spending uses", async () => {
    const used = makeService(null, 2);
    await expect(used.service.remove("s-1", "user-1")).rejects.toBeInstanceOf(ConflictException);
    expect(used.prisma.stores.delete).not.toHaveBeenCalled();

    const unused = makeService();
    await unused.service.remove("s-1", "user-1");
    expect(unused.prisma.stores.delete).toHaveBeenCalledWith({ where: { ID: "s-1" } });
  });
});
