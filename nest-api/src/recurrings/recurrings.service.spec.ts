import { RecurringsService } from "./recurrings.service";

/**
 * Unit tests for RecurringsService.getDrawn — the real year-to-date "déjà
 * prélevé" backing the Statistics fixed-expenses widget (COS-49). Recurrings are
 * stored one row per month, so this sums the actual rows from January through the
 * client's current month. Prisma is mocked, so these assert the query window and
 * the Decimal coercion without touching the DB.
 */
describe("RecurringsService.getDrawn", () => {
  const makeService = (aggregate: jest.Mock) => {
    const prisma = { recurrings: { aggregate } } as unknown as never;
    return new RecurringsService(prisma);
  };

  it("sums the rows from January through the given month (inclusive), timezone-safe", async () => {
    const aggregate = jest.fn().mockResolvedValue({ _sum: { amount: 1250 } });
    const service = makeService(aggregate);

    const result = await service.getDrawn("2026", "6", "user-1"); // through July (index 6)

    expect(aggregate).toHaveBeenCalledWith({
      _sum: { amount: true },
      where: {
        userID: "user-1",
        dateFrom: { gte: new Date(Date.UTC(2026, 0, 1)), lt: new Date(Date.UTC(2026, 7, 1)) },
      },
    });
    expect(result).toEqual({ drawn: 1250 });
  });

  it("includes the whole current month and crosses the year boundary in December", async () => {
    const aggregate = jest.fn().mockResolvedValue({ _sum: { amount: 9000 } });
    const service = makeService(aggregate);

    await service.getDrawn("2026", "11", "user-1"); // December

    expect(aggregate.mock.calls[0][0].where.dateFrom).toEqual({
      gte: new Date(Date.UTC(2026, 0, 1)),
      lt: new Date(Date.UTC(2027, 0, 1)),
    });
  });

  it("coerces a Prisma Decimal sum and returns 0 when there are no rows", async () => {
    const service = makeService(jest.fn().mockResolvedValue({ _sum: { amount: null } }));
    expect(await service.getDrawn("2026", "0", "user-1")).toEqual({ drawn: 0 });

    const withDecimal = makeService(jest.fn().mockResolvedValue({ _sum: { amount: "2750.50" } }));
    expect(await withDecimal.getDrawn("2026", "6", "user-1")).toEqual({ drawn: 2750.5 });
  });

  it("returns 0 without querying for an invalid or out-of-range year/month", async () => {
    const aggregate = jest.fn();
    const service = makeService(aggregate);

    expect(await service.getDrawn("nope", "6", "user-1")).toEqual({ drawn: 0 });
    expect(await service.getDrawn("2026", "bad", "user-1")).toEqual({ drawn: 0 });
    expect(await service.getDrawn("2026", "12", "user-1")).toEqual({ drawn: 0 });
    expect(aggregate).not.toHaveBeenCalled();
  });
});

/**
 * A recurring carries a category like a spending (PFA-38): resolved on write,
 * flattened to name/colour on read, carried forward by the month copy.
 */
describe("RecurringsService category", () => {
  const userID = "user-1";

  it("flattens the joined category to name/colour, hiding another user's", async () => {
    const findMany = jest.fn().mockResolvedValue([
      { ID: "r1", categoryID: "c1", category: { ID: "c1", userID, name: "Housing", color: "#111" } },
      { ID: "r2", categoryID: "c2", category: { ID: "c2", userID: "other", name: "Secret", color: "#222" } },
      { ID: "r3", categoryID: null, category: null },
    ]);
    const service = new RecurringsService({ recurrings: { findMany } } as unknown as never);

    const rows = await service.getRecurrings("2026-10-01", userID);

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ include: { category: true } }));
    expect(rows.map(({ category, categoryColor }) => ({ category, categoryColor }))).toEqual([
      { category: "Housing", categoryColor: "#111" },
      { category: null, categoryColor: null },
      { category: null, categoryColor: null },
    ]);
  });

  it("creates a recurring on a new category typed by name", async () => {
    const create = jest.fn();
    let newCategoryID: string | undefined;
    const createCategory = jest.fn((args: { data: { ID: string } }) => {
      newCategoryID = args.data.ID;
    });
    const prisma = {
      recurrings: { create },
      categories: { findFirst: jest.fn().mockResolvedValue(null), create: createCategory },
    };
    const service = new RecurringsService(prisma as unknown as never);

    await service.createRecurring(
      {
        start: "2026-10-01",
        end: "2026-10-31",
        label: "Rent",
        amount: 900,
        category: { ID: null, name: "Housing", color: "#111" },
      },
      userID,
    );

    expect(newCategoryID).toBeDefined();
    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ categoryID: newCategoryID }) });
  });

  it("rejects an update pointing at a category the user cannot see", async () => {
    const prisma = {
      recurrings: { updateMany: jest.fn() },
      categories: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new RecurringsService(prisma as unknown as never);

    await expect(
      service.updateRecurring("r1", userID, { label: "Rent", amount: 900, category: { ID: "c-other" } }),
    ).rejects.toThrow("Invalid category ID");
    expect(prisma.recurrings.updateMany).not.toHaveBeenCalled();
  });

  it("carries the category forward when copying the previous month", async () => {
    const createMany = jest.fn();
    const prisma = {
      recurrings: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ label: "Rent", amount: 900, itemType: "recurring", currency: null, categoryID: "c1" }]),
        createMany,
      },
    };
    const service = new RecurringsService(prisma as unknown as never);

    await service.copyRecurrings(userID, { start: "2026-11-01", end: "2026-11-30", previousMonthStart: "2026-10-01" });

    expect(createMany).toHaveBeenCalledWith({ data: [expect.objectContaining({ categoryID: "c1" })] });
  });
});
