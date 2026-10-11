import { NotFoundException } from "@nestjs/common";
import { ExceptionalsService } from "./exceptionals.service";

/**
 * Unit tests for ExceptionalsService (PFA-12): the year filter, the year list
 * and the ownership check on writes. Prisma is mocked.
 */
describe("ExceptionalsService", () => {
  const makeService = (exceptionals: Record<string, jest.Mock>) => {
    const prisma = { exceptionals } as unknown as never;
    return new ExceptionalsService(prisma);
  };

  const DTO = { date: "2026-03-14", label: "Repair", amount: 120 };

  describe("getExceptionals", () => {
    it("narrows to the requested year", async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      await makeService({ findMany }).getExceptionals("user-1", "2026");

      expect(findMany).toHaveBeenCalledWith({
        where: { userID: "user-1", date: { gte: new Date("2026-01-01"), lte: new Date("2026-12-31") } },
        orderBy: { date: "desc" },
      });
    });

    it("ignores a missing or unparsable year", async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const service = makeService({ findMany });

      await service.getExceptionals("user-1");
      await service.getExceptionals("user-1", "abc");

      expect(findMany.mock.calls[0][0].where).toEqual({ userID: "user-1" });
      expect(findMany.mock.calls[1][0].where).toEqual({ userID: "user-1" });
    });
  });

  it("lists each year once, newest first", async () => {
    const findMany = jest
      .fn()
      .mockResolvedValue([
        { date: new Date(2024, 5, 1) },
        { date: new Date(2026, 0, 10) },
        { date: new Date(2024, 11, 1) },
        { date: new Date(2025, 2, 3) },
      ]);

    expect(await makeService({ findMany }).getAvailableYears("user-1")).toEqual([2026, 2025, 2024]);
  });

  it("creates with nullable fields set to null", async () => {
    const create = jest.fn().mockResolvedValue(undefined);
    const result = await makeService({ create }).createExceptional(DTO, "user-1");

    expect(create.mock.calls[0][0].data).toMatchObject({
      ID: result.ID,
      userID: "user-1",
      description: null,
      currency: null,
      categoryName: null,
      categoryColor: null,
    });
  });

  it("scopes updates to the owner and 404s on someone else's row", async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 0 });
    await expect(makeService({ updateMany }).updateExceptional("exc-1", "user-1", DTO)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(updateMany.mock.calls[0][0].where).toEqual({ ID: "exc-1", userID: "user-1" });
  });

  it("scopes deletes to the owner and 404s on someone else's row", async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 0 });
    await expect(makeService({ deleteMany }).deleteExceptional("exc-1", "user-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(deleteMany).toHaveBeenCalledWith({ where: { ID: "exc-1", userID: "user-1" } });

    const found = makeService({ deleteMany: jest.fn().mockResolvedValue({ count: 1 }) });
    expect(await found.deleteExceptional("exc-1", "user-1")).toEqual({ success: true });
  });
});
