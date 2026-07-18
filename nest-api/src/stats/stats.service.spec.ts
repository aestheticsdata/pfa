import { StatsService } from "./stats.service";

/**
 * Unit tests for StatsService.getCategoryStats — the all-time per-category usage
 * aggregate backing the Categories page (COS-20). Prisma is mocked, so these
 * assert the query shape and the JS transformation without touching the DB.
 */
describe("StatsService.getCategoryStats", () => {
  const makeService = (groupByResult: unknown[]) => {
    const groupBy = jest.fn().mockResolvedValue(groupByResult);
    // Only spendings.groupBy is exercised; cast keeps the mock minimal.
    const prisma = { spendings: { groupBy } } as unknown as never;
    return { service: new StatsService(prisma), groupBy };
  };

  it("queries all-history per-category aggregates scoped to the user", async () => {
    const { service, groupBy } = makeService([]);

    await service.getCategoryStats("user-1");

    // No date filter (all history), grouped by category, scoped to the user,
    // asking for both the amount sum and the row count.
    expect(groupBy).toHaveBeenCalledWith({
      by: ["categoryID"],
      where: { userID: "user-1" },
      _sum: { amount: true },
      _count: true,
    });
  });

  it("returns zeros when the user has no spendings", async () => {
    const { service } = makeService([]);

    await expect(service.getCategoryStats("user-1")).resolves.toEqual({
      totalSpent: 0,
      byCategory: [],
    });
  });

  it("maps count + total per category and sums totalSpent", async () => {
    const { service } = makeService([
      { categoryID: "cat-a", _sum: { amount: 120.5 }, _count: 3 },
      { categoryID: "cat-b", _sum: { amount: 80 }, _count: 2 },
    ]);

    const result = await service.getCategoryStats("user-1");

    expect(result.totalSpent).toBe(200.5);
    expect(result.byCategory).toEqual([
      { categoryID: "cat-a", count: 3, total: 120.5 },
      { categoryID: "cat-b", count: 2, total: 80 },
    ]);
  });

  it("counts uncategorized spendings in totalSpent but excludes them from byCategory", async () => {
    const { service } = makeService([
      { categoryID: "cat-a", _sum: { amount: 120 }, _count: 3 },
      { categoryID: null, _sum: { amount: 50 }, _count: 1 },
    ]);

    const result = await service.getCategoryStats("user-1");

    expect(result.totalSpent).toBe(170);
    expect(result.byCategory).toEqual([{ categoryID: "cat-a", count: 3, total: 120 }]);
    expect(result.byCategory.some((c) => c.categoryID === null)).toBe(false);
  });

  it("treats a null amount sum as 0", async () => {
    const { service } = makeService([{ categoryID: "cat-a", _sum: { amount: null }, _count: 0 }]);

    const result = await service.getCategoryStats("user-1");

    expect(result.totalSpent).toBe(0);
    expect(result.byCategory).toEqual([{ categoryID: "cat-a", count: 0, total: 0 }]);
  });

  it("converts Prisma Decimal amounts (object with toString) to numbers", async () => {
    // Prisma returns Decimal instances for _sum.amount; the service relies on
    // Number(...) coercing them via their string form.
    const decimal = { toString: () => "99.99" };
    const { service } = makeService([{ categoryID: "cat-a", _sum: { amount: decimal }, _count: 1 }]);

    const result = await service.getCategoryStats("user-1");

    expect(result.totalSpent).toBeCloseTo(99.99, 2);
    expect(result.byCategory[0]?.total).toBeCloseTo(99.99, 2);
  });
});

/**
 * Unit tests for StatsService.getDailyStats — the per-day spending totals for a
 * year backing the daily heatmap (COS-45) and the day-of-week averages (COS-48).
 * Prisma is mocked; these assert the query range/scoping and the JS bucketing.
 */
describe("StatsService.getDailyStats", () => {
  const makeService = (findManyResult: { date: Date; amount: unknown }[]) => {
    const findMany = jest.fn().mockResolvedValue(findManyResult);
    const prisma = { spendings: { findMany } } as unknown as never;
    return { service: new StatsService(prisma), findMany };
  };

  it("returns no days and skips the query for a non-numeric year", async () => {
    const { service, findMany } = makeService([]);

    await expect(service.getDailyStats("not-a-year", "user-1")).resolves.toEqual({ days: [] });
    expect(findMany).not.toHaveBeenCalled();
  });

  it("queries the whole year as a half-open UTC range, scoped to the user", async () => {
    const { service, findMany } = makeService([]);

    await service.getDailyStats("2023", "user-1");

    expect(findMany).toHaveBeenCalledWith({
      where: {
        userID: "user-1",
        date: { gte: new Date(Date.UTC(2023, 0, 1)), lt: new Date(Date.UTC(2024, 0, 1)) },
      },
      select: { date: true, amount: true },
    });
  });

  it("buckets rows per day (sum + count), sorted chronologically", async () => {
    const { service } = makeService([
      { date: new Date("2023-03-15T00:00:00.000Z"), amount: 10 },
      { date: new Date("2023-01-02T00:00:00.000Z"), amount: 5 },
      { date: new Date("2023-03-15T00:00:00.000Z"), amount: 2.5 },
    ]);

    const result = await service.getDailyStats("2023", "user-1");

    expect(result.days).toEqual([
      { date: "2023-01-02", total: 5, count: 1 },
      { date: "2023-03-15", total: 12.5, count: 2 },
    ]);
  });

  it("keys days by their UTC calendar date, including the year's first and last day", async () => {
    // Late-in-day UTC timestamps must still key to the UTC calendar date (not the
    // local one) so day buckets are timezone-safe on any runner.
    const { service } = makeService([
      { date: new Date("2023-01-01T00:00:00.000Z"), amount: 5 },
      { date: new Date("2023-12-31T23:59:59.000Z"), amount: 8 },
    ]);

    const result = await service.getDailyStats("2023", "user-1");

    expect(result.days).toEqual([
      { date: "2023-01-01", total: 5, count: 1 },
      { date: "2023-12-31", total: 8, count: 1 },
    ]);
  });

  it("coerces Prisma Decimal amounts and rounds the daily total to the cent", async () => {
    const decimal = (v: string) => ({ toString: () => v });
    const { service } = makeService([
      { date: new Date("2023-02-01T00:00:00.000Z"), amount: decimal("10.004") },
      { date: new Date("2023-02-01T00:00:00.000Z"), amount: decimal("0.004") },
    ]);

    const result = await service.getDailyStats("2023", "user-1");

    expect(result.days).toEqual([{ date: "2023-02-01", total: 10.01, count: 2 }]);
  });
});
