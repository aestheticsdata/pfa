import { ConflictException, NotFoundException } from "@nestjs/common";
import { ProductTypesService } from "@spendings/product-types/product-types.service";

/** PFA-224 — managing the user's product types: rename, merge, delete. Invented names. */
describe("ProductTypesService management", () => {
  const makeService = (twin: { ID: string } | null = null, inUse = 0) => {
    const owned = new Set(["t-1", "t-2"]);
    const prisma = {
      productTypes: {
        findFirst: jest.fn(({ where }: { where: { ID?: unknown } }) =>
          Promise.resolve(typeof where.ID === "string" ? (owned.has(where.ID) ? { ID: where.ID } : null) : twin),
        ),
        update: jest.fn(({ data }: { data: Record<string, unknown> }) => Promise.resolve(data)),
        delete: jest.fn((args: unknown) => ({ op: "delete", args })),
      },
      receiptLines: {
        updateMany: jest.fn((args: unknown) => ({ op: "updateMany", args })),
        count: jest.fn().mockResolvedValue(inUse),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    return { service: new ProductTypesService(prisma as never), prisma };
  };

  it("renames with the key recomputed, and refuses a name another type bears", async () => {
    const { service, prisma } = makeService();
    await service.rename("t-1", " Savon liquide ", "user-1");
    expect(prisma.productTypes.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: "Savon liquide", nameKey: "SAVON LIQUIDE" } }),
    );

    const taken = makeService({ ID: "t-2" });
    await expect(taken.service.rename("t-1", "SAVON LIQUIDE", "user-1")).rejects.toMatchObject({
      response: { conflictID: "t-2" },
    });
  });

  it("merges in one transaction: receipt lines move, then the source goes", async () => {
    const { service, prisma } = makeService();
    await service.merge("t-1", "t-2", "user-1");
    expect(prisma.receiptLines.updateMany).toHaveBeenCalledWith({
      where: { productTypeID: "t-1" },
      data: { productTypeID: "t-2" },
    });
    expect(prisma.productTypes.delete).toHaveBeenCalledWith({ where: { ID: "t-1" } });
    await expect(service.merge("other", "t-2", "user-1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("deletes only a type no line has", async () => {
    const used = makeService(null, 1);
    await expect(used.service.remove("t-1", "user-1")).rejects.toBeInstanceOf(ConflictException);
    const unused = makeService();
    await unused.service.remove("t-1", "user-1");
    expect(unused.prisma.productTypes.delete).toHaveBeenCalledTimes(1);
  });
});
