import { CategoryStatsService } from "@stats/services/category-stats.service";

/**
 * Unit tests for CategoryStatsService.getCategoryStats — the all-time per-category usage
 * aggregate backing the Categories page (COS-20). Prisma is mocked, so these
 * assert the query shape and the JS transformation without touching the DB.
 */
describe("CategoryStatsService.getCategoryStats", () => {
  const makeService = (groupByResult: unknown[]) => {
    const groupBy = jest.fn().mockResolvedValue(groupByResult);
    // Only spendings.groupBy is exercised; cast keeps the mock minimal.
    const prisma = { spendings: { groupBy } } as unknown as never;
    return { service: new CategoryStatsService(prisma), groupBy };
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

  it("scopes to a half-open UTC window when from/to are given, with `to` inclusive", async () => {
    const { service, groupBy } = makeService([]);

    await service.getCategoryStats("user-1", "2026-01-01", "2026-07-19");

    // `to` is made inclusive by pushing the exclusive upper bound to the next UTC day.
    expect(groupBy).toHaveBeenCalledWith({
      by: ["categoryID"],
      where: {
        userID: "user-1",
        date: { gte: new Date(Date.UTC(2026, 0, 1)), lt: new Date(Date.UTC(2026, 6, 20)) },
      },
      _sum: { amount: true },
      _count: true,
    });
  });

  it("supports an open-ended window (only `from`, or only `to`)", async () => {
    const { service, groupBy } = makeService([]);

    await service.getCategoryStats("user-1", "2026-01-01");
    expect(groupBy).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { userID: "user-1", date: { gte: new Date(Date.UTC(2026, 0, 1)) } } }),
    );

    await service.getCategoryStats("user-1", undefined, "2026-07-19");
    expect(groupBy).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { userID: "user-1", date: { lt: new Date(Date.UTC(2026, 6, 20)) } } }),
    );
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
