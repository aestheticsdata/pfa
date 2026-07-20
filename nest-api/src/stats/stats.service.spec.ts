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

/**
 * Unit tests for StatsService.getCategoryTrends — the per-category two-window
 * aggregate backing the dashboard's monthly trend column + "Catégorie en hausse"
 * insight (COS-41) and the Dépenses weekly breakdown + avg/day delta (COS-35).
 * Prisma is mocked, so these assert the two query shapes, the category-name
 * resolution, the current↔previous pairing (incl. the null "nouv." case), and
 * the comparison-window `previousTotal` — without touching the DB. The delta %
 * lives on the front.
 */
describe("StatsService.getCategoryTrends", () => {
  // groupBy is called twice (current window then previous); findMany resolves
  // names/colours for the current window's categories.
  const makeService = (current: unknown[], previous: unknown[], categories: unknown[] = []) => {
    const groupBy = jest.fn().mockResolvedValueOnce(current).mockResolvedValueOnce(previous);
    const findMany = jest.fn().mockResolvedValue(categories);
    const prisma = { spendings: { groupBy }, categories: { findMany } } as unknown as never;
    return { service: new StatsService(prisma), groupBy, findMany };
  };

  const args = ["user-1", "2026-07-01", "2026-07-31", "2026-06-01", "2026-06-30"] as const;

  it("groups current + previous windows by category over half-open UTC ranges, ordering only the current one", async () => {
    const { service, groupBy } = makeService([], []);

    await service.getCategoryTrends(...args);

    expect(groupBy).toHaveBeenNthCalledWith(1, {
      by: ["categoryID"],
      where: { userID: "user-1", date: { gte: new Date(Date.UTC(2026, 6, 1)), lt: new Date(Date.UTC(2026, 7, 1)) } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    });
    expect(groupBy).toHaveBeenNthCalledWith(2, {
      by: ["categoryID"],
      where: { userID: "user-1", date: { gte: new Date(Date.UTC(2026, 5, 1)), lt: new Date(Date.UTC(2026, 6, 1)) } },
      _sum: { amount: true },
    });
  });

  it("resolves names/colours for the current window's categories only", async () => {
    const { service, findMany } = makeService(
      [
        { categoryID: "cat-a", _sum: { amount: 120 } },
        { categoryID: "cat-b", _sum: { amount: 80 } },
      ],
      [],
      [
        { ID: "cat-a", name: "abonnements", color: "#7c3aed" },
        { ID: "cat-b", name: "transports", color: "#0ea5e9" },
      ],
    );

    await service.getCategoryTrends(...args);

    expect(findMany).toHaveBeenCalledWith({
      where: { ID: { in: ["cat-a", "cat-b"] }, OR: [{ userID: "user-1" }, { userID: null }] },
      select: { ID: true, name: true, color: true },
    });
  });

  it("pairs each current category with its previous total, and null when it is new to the window", async () => {
    const { service } = makeService(
      [
        { categoryID: "cat-a", _sum: { amount: 120 } },
        { categoryID: "cat-b", _sum: { amount: 80 } },
      ],
      [
        { categoryID: "cat-a", _sum: { amount: 100 } },
        { categoryID: "cat-c", _sum: { amount: 50 } },
      ],
      [
        { ID: "cat-a", name: "abonnements", color: "#7c3aed" },
        { ID: "cat-b", name: "transports", color: "#0ea5e9" },
      ],
    );

    const { trends } = await service.getCategoryTrends(...args);

    // cat-c is only in the previous window → not a current row; cat-b has no
    // previous total → previousValue null ("nouv."). Order follows the current query.
    expect(trends).toEqual([
      { category: "abonnements", categoryColor: "#7c3aed", value: 120, previousValue: 100 },
      { category: "transports", categoryColor: "#0ea5e9", value: 80, previousValue: null },
    ]);
  });

  it("keeps uncategorized spendings with their own previous bucket and no category lookup", async () => {
    const { service, findMany } = makeService(
      [{ categoryID: null, _sum: { amount: 40 } }],
      [{ categoryID: null, _sum: { amount: 30 } }],
    );

    const { trends } = await service.getCategoryTrends(...args);

    expect(trends).toEqual([{ category: null, categoryColor: null, value: 40, previousValue: 30 }]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("returns no trends and skips the category lookup when the current window is empty", async () => {
    const { service, findMany } = makeService([], [{ categoryID: "cat-a", _sum: { amount: 100 } }]);

    // previousTotal still reflects the (non-empty) comparison window.
    await expect(service.getCategoryTrends(...args)).resolves.toEqual({ trends: [], previousTotal: 100 });
    expect(findMany).not.toHaveBeenCalled();
  });

  it("sums previousTotal over the whole comparison window, incl. categories absent from the current one", async () => {
    const { service } = makeService(
      [{ categoryID: "cat-a", _sum: { amount: 120 } }],
      [
        { categoryID: "cat-a", _sum: { amount: 100 } },
        { categoryID: "cat-c", _sum: { amount: 50 } },
        { categoryID: null, _sum: { amount: 30 } },
      ],
      [{ ID: "cat-a", name: "abonnements", color: "#7c3aed" }],
    );

    const { previousTotal } = await service.getCategoryTrends(...args);

    // 100 (cat-a) + 50 (cat-c, gone this week) + 30 (uncategorized) = 180.
    expect(previousTotal).toBe(180);
  });

  it("rounds summed Prisma Decimals to the cent in both windows and in previousTotal", async () => {
    const decimal = (value: string) => ({ toString: () => value });
    const { service } = makeService(
      [{ categoryID: "cat-a", _sum: { amount: decimal("120.005") } }],
      [{ categoryID: "cat-a", _sum: { amount: decimal("99.994") } }],
      [{ ID: "cat-a", name: "abonnements", color: "#7c3aed" }],
    );

    const { trends, previousTotal } = await service.getCategoryTrends(...args);

    expect(trends[0]?.value).toBeCloseTo(120.01, 2);
    expect(trends[0]?.previousValue).toBeCloseTo(99.99, 2);
    expect(previousTotal).toBeCloseTo(99.99, 2);
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

/**
 * Unit tests for StatsService.getBiggestRegularExpense — the single biggest
 * one-off (non-exceptional) expense of a year, backing the "courante" row of the
 * Statistiques "Plus grosse dépense" KPI card (COS-46). Prisma is mocked; these
 * assert the query shape (max-amount row in the Spendings table only) and the
 * mapping to the response envelope.
 */
describe("StatsService.getBiggestRegularExpense", () => {
  const makeService = (findFirstResult: unknown) => {
    const findFirst = jest.fn().mockResolvedValue(findFirstResult);
    const prisma = { spendings: { findFirst } } as unknown as never;
    return { service: new StatsService(prisma), findFirst };
  };

  it("returns a null expense and skips the query for a non-numeric year", async () => {
    const { service, findFirst } = makeService(null);

    await expect(service.getBiggestRegularExpense("not-a-year", "user-1")).resolves.toEqual({ expense: null });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("queries the year's max-amount spending as a half-open UTC range, scoped to the user", async () => {
    const { service, findFirst } = makeService(null);

    await service.getBiggestRegularExpense("2023", "user-1");

    // Spendings table only (exceptionals/recurrings live elsewhere), biggest
    // amount first, with the category joined for the label/color.
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        userID: "user-1",
        date: { gte: new Date(Date.UTC(2023, 0, 1)), lt: new Date(Date.UTC(2024, 0, 1)) },
      },
      orderBy: { amount: "desc" },
      include: { category: true },
    });
  });

  it("returns a null expense when the user has no spending that year", async () => {
    const { service } = makeService(null);

    await expect(service.getBiggestRegularExpense("2023", "user-1")).resolves.toEqual({ expense: null });
  });

  it("maps the biggest row to label / amount / UTC date / category", async () => {
    const { service } = makeService({
      label: "Canapé",
      amount: 899.9,
      date: new Date("2023-06-15T00:00:00.000Z"),
      category: { name: "Maison", color: "#abcdef" },
    });

    await expect(service.getBiggestRegularExpense("2023", "user-1")).resolves.toEqual({
      expense: {
        label: "Canapé",
        amount: 899.9,
        date: "2023-06-15",
        categoryName: "Maison",
        categoryColor: "#abcdef",
      },
    });
  });

  it("returns null category fields for an uncategorized spending", async () => {
    const { service } = makeService({
      label: "Divers",
      amount: 300,
      date: new Date("2023-02-01T00:00:00.000Z"),
      category: null,
    });

    const result = await service.getBiggestRegularExpense("2023", "user-1");

    expect(result).toEqual({
      expense: { label: "Divers", amount: 300, date: "2023-02-01", categoryName: null, categoryColor: null },
    });
  });

  it("coerces a Prisma Decimal amount (object with toString) to a number", async () => {
    const decimal = { toString: () => "1499.99" };
    const { service } = makeService({
      label: "Frigo",
      amount: decimal,
      date: new Date("2023-11-20T00:00:00.000Z"),
      category: { name: "Maison", color: "#000000" },
    });

    const result = await service.getBiggestRegularExpense("2023", "user-1");

    expect(result.expense?.amount).toBeCloseTo(1499.99, 2);
  });
});
