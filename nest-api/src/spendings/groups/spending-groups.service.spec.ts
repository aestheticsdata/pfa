import { BadRequestException, NotFoundException } from "@nestjs/common";
import { SpendingGroupsService } from "@spendings/groups/spending-groups.service";

/**
 * "Group N spendings" (PFA-189): same-day rows only, the first receipt found is
 * kept for the whole group, and the others are released.
 */
describe("SpendingGroupsService.merge", () => {
  const day = new Date("2026-05-04T00:00:00Z");

  const makeService = (rows: { ID: string; date: Date; invoicefile: string | null; groupID: string | null }[]) => {
    const update = jest.fn((args: unknown) => args);
    const prisma = {
      spendings: { findMany: jest.fn().mockResolvedValue(rows), update },
      spendingGroups: { create: jest.fn((args: unknown) => args), deleteMany: jest.fn((args: unknown) => args) },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const release = jest.fn().mockResolvedValue(undefined);
    const service = new SpendingGroupsService(prisma as never, {} as never, { release } as never);
    return { service, update, release };
  };

  const lines = [
    { spendingID: "a", detail: "Groceries" },
    { spendingID: "b", detail: "Soap" },
  ];

  it("keeps the first receipt in the sent order and composes each line's label", async () => {
    const { service, update, release } = makeService([
      { ID: "b", date: day, invoicefile: "b-r.jpg", groupID: null },
      { ID: "a", date: day, invoicefile: "a-r.jpg", groupID: null },
    ]);

    const result = await service.merge({ label: "Store", lines }, "user-1");

    expect(result.invoicefile).toBe("a-r.jpg");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ID: "b" },
        data: expect.objectContaining({ label: "Store — Soap", detail: "Soap", invoicefile: "a-r.jpg" }),
      }),
    );
    // b's own receipt is now held by nothing → released (the release checks references).
    expect(release).toHaveBeenCalledWith("user-1", ["b-r.jpg", "a-r.jpg"]);
  });

  it("refuses spendings of different days", async () => {
    const { service } = makeService([
      { ID: "a", date: day, invoicefile: null, groupID: null },
      { ID: "b", date: new Date("2026-05-05T00:00:00Z"), invoicefile: null, groupID: null },
    ]);

    await expect(service.merge({ label: "Store", lines }, "user-1")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("refuses a spending the user does not own", async () => {
    const { service } = makeService([{ ID: "a", date: day, invoicefile: null, groupID: null }]);

    await expect(service.merge({ label: "Store", lines }, "user-1")).rejects.toBeInstanceOf(NotFoundException);
  });
});
