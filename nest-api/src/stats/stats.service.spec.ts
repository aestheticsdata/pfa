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

/**
 * Unit tests for StatsService.getBusiestWeek — the calendar week-range of a month
 * with the most one-off spendings, backing the dashboard's 4th ribbon insight
 * (COS-139). "Week" = the month's calendar-aligned Sun→Sat ranges truncated at
 * the month edges (the same slices the app shows everywhere), NOT a rolling
 * window. Prisma is mocked; these assert the query shape (per-day counts over a
 * half-open UTC month range) and the JS bucketing/max/tie-break.
 */
describe("StatsService.getBusiestWeek", () => {
  const makeService = (groupByResult: { date: Date; _count: number }[]) => {
    const groupBy = jest.fn().mockResolvedValue(groupByResult);
    const prisma = { spendings: { groupBy } } as unknown as never;
    return { service: new StatsService(prisma), groupBy };
  };

  it("counts spendings per day over a half-open UTC month range, scoped to the user", async () => {
    const { service, groupBy } = makeService([]);

    await service.getBusiestWeek("2026-06-01", "user-1");

    expect(groupBy).toHaveBeenCalledWith({
      by: ["date"],
      where: { userID: "user-1", date: { gte: new Date(Date.UTC(2026, 5, 1)), lt: new Date(Date.UTC(2026, 6, 1)) } },
      _count: true,
    });
  });

  it("returns the calendar week-range with the most spendings (Sun→Sat, truncated at the month edges)", async () => {
    // June 2026 starts on a Monday → ranges 1–6, 7–13, 14–20, 21–27, 28–30.
    const { service } = makeService([
      { date: new Date(Date.UTC(2026, 5, 3)), _count: 1 }, // range 1–6
      { date: new Date(Date.UTC(2026, 5, 8)), _count: 5 }, // range 7–13
      { date: new Date(Date.UTC(2026, 5, 10)), _count: 4 }, // range 7–13
      { date: new Date(Date.UTC(2026, 5, 15)), _count: 2 }, // range 14–20
    ]);

    await expect(service.getBusiestWeek("2026-06-01", "user-1")).resolves.toEqual({
      count: 9,
      from: "2026-06-07",
      to: "2026-06-13",
    });
  });

  it("aligns the partial first week on the 1st of the month, whatever day `start` falls on", async () => {
    // start is June 4th (a Thursday), but the first slice must still be 1–6 (the
    // month starts on Monday), not 1–3. A single spending on the 8th belongs to
    // the 7–13 range, not the buggy 4–10 one.
    const { service } = makeService([{ date: new Date(Date.UTC(2026, 5, 8)), _count: 3 }]);

    await expect(service.getBusiestWeek("2026-06-04", "user-1")).resolves.toEqual({
      count: 3,
      from: "2026-06-07",
      to: "2026-06-13",
    });
  });

  it("treats a month whose 1st is a Sunday as four full Sun→Sat weeks", async () => {
    // February 2026 starts on a Sunday → ranges 1–7, 8–14, 15–21, 22–28.
    const { service } = makeService([{ date: new Date(Date.UTC(2026, 1, 10)), _count: 4 }]);

    await expect(service.getBusiestWeek("2026-02-01", "user-1")).resolves.toEqual({
      count: 4,
      from: "2026-02-08",
      to: "2026-02-14",
    });
  });

  it("breaks ties toward the earliest range", async () => {
    const { service } = makeService([
      { date: new Date(Date.UTC(2026, 5, 3)), _count: 2 }, // range 1–6
      { date: new Date(Date.UTC(2026, 5, 8)), _count: 2 }, // range 7–13
    ]);

    await expect(service.getBusiestWeek("2026-06-01", "user-1")).resolves.toEqual({
      count: 2,
      from: "2026-06-01",
      to: "2026-06-06",
    });
  });

  it("returns count 0 and null bounds for a month with no spending", async () => {
    const { service } = makeService([]);

    await expect(service.getBusiestWeek("2026-06-01", "user-1")).resolves.toEqual({
      count: 0,
      from: null,
      to: null,
    });
  });
});

/**
 * Unit tests for StatsService.getSpendingPace — the totals of the three months
 * before a reference month, backing the dashboard's "Sur le rythme" insight
 * (COS-40). Prisma is mocked, so these assert the (half-open, UTC) query shape
 * and the newest→oldest transformation without a DB.
 */
describe("StatsService.getSpendingPace", () => {
  const makeService = (totals: number[]) => {
    // One aggregate call per month back (M-1, M-2, M-3), resolved in call order.
    const aggregate = jest.fn();
    totals.forEach((total) => aggregate.mockResolvedValueOnce({ _sum: { amount: total } }));
    const prisma = { spendings: { aggregate } } as unknown as never;
    return { service: new StatsService(prisma), aggregate };
  };

  it("sums each of the three preceding months over a half-open UTC range, scoped to the user", async () => {
    const { service, aggregate } = makeService([0, 0, 0]);

    await service.getSpendingPace("2026-06-01", "user-1");

    expect(aggregate).toHaveBeenCalledTimes(3);
    expect(aggregate).toHaveBeenNthCalledWith(1, {
      where: { userID: "user-1", date: { gte: new Date(Date.UTC(2026, 4, 1)), lt: new Date(Date.UTC(2026, 5, 1)) } },
      _sum: { amount: true },
    });
    expect(aggregate).toHaveBeenNthCalledWith(2, {
      where: { userID: "user-1", date: { gte: new Date(Date.UTC(2026, 3, 1)), lt: new Date(Date.UTC(2026, 4, 1)) } },
      _sum: { amount: true },
    });
    expect(aggregate).toHaveBeenNthCalledWith(3, {
      where: { userID: "user-1", date: { gte: new Date(Date.UTC(2026, 2, 1)), lt: new Date(Date.UTC(2026, 3, 1)) } },
      _sum: { amount: true },
    });
  });

  it("returns the three totals newest→oldest with their month's first day", async () => {
    const { service } = makeService([1240.5, 1310, 980.25]);

    await expect(service.getSpendingPace("2026-06-01", "user-1")).resolves.toEqual({
      months: [
        { month: "2026-05-01", total: 1240.5 },
        { month: "2026-04-01", total: 1310 },
        { month: "2026-03-01", total: 980.25 },
      ],
    });
  });

  it("wraps across the year boundary and reports 0 for an empty month", async () => {
    // Reference January 2026 → M-1 Dec, M-2 Nov, M-3 Oct 2025.
    const { service } = makeService([0, 500, 300]);

    await expect(service.getSpendingPace("2026-01-01", "user-1")).resolves.toEqual({
      months: [
        { month: "2025-12-01", total: 0 },
        { month: "2025-11-01", total: 500 },
        { month: "2025-10-01", total: 300 },
      ],
    });
  });

  it("coerces a null Prisma sum to 0", async () => {
    const { service } = makeService([null as unknown as number, null as unknown as number, null as unknown as number]);

    await expect(service.getSpendingPace("2026-06-01", "user-1")).resolves.toEqual({
      months: [
        { month: "2026-05-01", total: 0 },
        { month: "2026-04-01", total: 0 },
        { month: "2026-03-01", total: 0 },
      ],
    });
  });
});

/**
 * Unit tests for StatsService.getWeekdayCategories — the dominant spending
 * category per weekday for a year, backing the day-of-week widget's hover tooltip
 * (COS-127). Prisma is mocked; these assert the query shape (categorized
 * Spendings over a half-open UTC year range) and the JS weekday×category
 * bucketing / winner selection.
 */
describe("StatsService.getWeekdayCategories", () => {
  const emptyWeekdays = () => Array.from({ length: 7 }, () => ({ name: null, color: null }));

  const makeService = (spendingRows: unknown[], categories: unknown[] = []) => {
    const spendingsFindMany = jest.fn().mockResolvedValue(spendingRows);
    const categoriesFindMany = jest.fn().mockResolvedValue(categories);
    const prisma = {
      spendings: { findMany: spendingsFindMany },
      categories: { findMany: categoriesFindMany },
    } as unknown as never;
    return { service: new StatsService(prisma), spendingsFindMany, categoriesFindMany };
  };

  it("returns seven null weekdays and skips the query for a non-numeric year", async () => {
    const { service, spendingsFindMany } = makeService([]);

    await expect(service.getWeekdayCategories("nope", "user-1")).resolves.toEqual({ weekdays: emptyWeekdays() });
    expect(spendingsFindMany).not.toHaveBeenCalled();
  });

  it("queries the year's categorized spendings as a half-open UTC range, scoped to the user", async () => {
    const { service, spendingsFindMany } = makeService([]);

    await service.getWeekdayCategories("2023", "user-1");

    expect(spendingsFindMany).toHaveBeenCalledWith({
      where: {
        userID: "user-1",
        date: { gte: new Date(Date.UTC(2023, 0, 1)), lt: new Date(Date.UTC(2024, 0, 1)) },
        categoryID: { not: null },
      },
      select: { date: true, amount: true, categoryID: true },
    });
  });

  it("picks the highest-total category per weekday (index 0 = Monday) and resolves its name/colour", async () => {
    // Jan 1 2023 is a Sunday, so Jan 2/9/16 are Mondays.
    const { service, categoriesFindMany } = makeService(
      [
        { date: new Date("2023-01-02T00:00:00.000Z"), amount: 70, categoryID: "cat-a" }, // Mon
        { date: new Date("2023-01-09T00:00:00.000Z"), amount: 40, categoryID: "cat-a" }, // Mon → cat-a = 110
        { date: new Date("2023-01-16T00:00:00.000Z"), amount: 90, categoryID: "cat-b" }, // Mon → cat-b = 90
        { date: new Date("2023-01-01T00:00:00.000Z"), amount: 50, categoryID: "cat-b" }, // Sun
      ],
      [
        { ID: "cat-a", name: "Alimentation", color: "#22c55e" },
        { ID: "cat-b", name: "Transports", color: "#0ea5e9" },
      ],
    );

    const { weekdays } = await service.getWeekdayCategories("2023", "user-1");

    expect(weekdays[0]).toEqual({ name: "Alimentation", color: "#22c55e" }); // Monday: cat-a (110) beats cat-b (90)
    expect(weekdays[6]).toEqual({ name: "Transports", color: "#0ea5e9" }); // Sunday: cat-b
    expect(weekdays[1]).toEqual({ name: null, color: null }); // Tuesday: no spending
    expect(categoriesFindMany).toHaveBeenCalledWith({
      where: { ID: { in: ["cat-a", "cat-b"] }, OR: [{ userID: "user-1" }, { userID: null }] },
      select: { ID: true, name: true, color: true },
    });
  });

  it("skips the category lookup and returns all-null weekdays with no categorized spending", async () => {
    const { service, categoriesFindMany } = makeService([]);

    await expect(service.getWeekdayCategories("2023", "user-1")).resolves.toEqual({ weekdays: emptyWeekdays() });
    expect(categoriesFindMany).not.toHaveBeenCalled();
  });

  it("coerces Prisma Decimal amounts and breaks ties toward the first-seen category", async () => {
    const decimal = (v: string) => ({ toString: () => v });
    const { service } = makeService(
      [
        { date: new Date("2023-01-02T00:00:00.000Z"), amount: decimal("50"), categoryID: "cat-a" }, // Mon
        { date: new Date("2023-01-09T00:00:00.000Z"), amount: decimal("50"), categoryID: "cat-b" }, // Mon, ties cat-a
      ],
      [
        { ID: "cat-a", name: "Alimentation", color: "#22c55e" },
        { ID: "cat-b", name: "Transports", color: "#0ea5e9" },
      ],
    );

    const { weekdays } = await service.getWeekdayCategories("2023", "user-1");

    // Ties use strict-greater, so cat-a (seen first) keeps Monday.
    expect(weekdays[0]).toEqual({ name: "Alimentation", color: "#22c55e" });
  });
});

/**
 * Unit tests for StatsService.getSearchTimeline — the time distribution of the
 * spendings matching a search term (COS-160). Prisma is mocked; these assert
 * the shared search where clause, the day/week bucketisation and the summary.
 */
describe("StatsService.getSearchTimeline", () => {
  const makeService = (rows: { date: Date; amount: unknown }[]) => {
    const findMany = jest.fn().mockResolvedValue(rows);
    // Only spendings.findMany is exercised; cast keeps the mock minimal.
    const prisma = { spendings: { findMany } } as unknown as never;
    return { service: new StatsService(prisma), findMany };
  };

  const emptyResponse = { buckets: [], summary: { total: 0, count: 0, firstDate: null, lastDate: null } };

  it("returns empty without hitting the DB when the trimmed query is shorter than 2 chars", async () => {
    const { service, findMany } = makeService([]);

    await expect(service.getSearchTimeline(" a ", "2026-01-01", "2026-12-31", "day", "user-1")).resolves.toEqual(
      emptyResponse,
    );
    expect(findMany).not.toHaveBeenCalled();
  });

  it("queries the shared search clause, scoped to the user, over an inclusive UTC window", async () => {
    const { service, findMany } = makeService([]);

    await service.getSearchTimeline(" librairie ", "2026-01-01", "2026-07-19", "day", "user-1");

    // Same label-OR-category clause as /spendings/search (trimmed term); `to`
    // is made inclusive by pushing the exclusive upper bound to the next UTC day.
    expect(findMany).toHaveBeenCalledWith({
      where: {
        userID: "user-1",
        OR: [{ label: { contains: "librairie" } }, { category: { is: { name: { contains: "librairie" } } } }],
        date: { gte: new Date(Date.UTC(2026, 0, 1)), lt: new Date(Date.UTC(2026, 6, 20)) },
      },
      select: { date: true, amount: true },
    });
  });

  it("escapes LIKE wildcards so % and _ match literally", async () => {
    const { service, findMany } = makeService([]);

    await service.getSearchTimeline("100%_x", "2026-01-01", "2026-12-31", "day", "user-1");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { label: { contains: "100\\%\\_x" } },
            { category: { is: { name: { contains: "100\\%\\_x" } } } },
          ],
        }),
      }),
    );
  });

  it("buckets by UTC day, skipping empty days, chronologically, with a rounded summary", async () => {
    const decimal = (v: string) => ({ toString: () => v });
    const { service } = makeService([
      { date: new Date("2026-03-10T09:30:00.000Z"), amount: decimal("10.10") },
      { date: new Date("2026-03-10T18:00:00.000Z"), amount: decimal("0.20") },
      { date: new Date("2026-03-02T00:00:00.000Z"), amount: decimal("5") },
    ]);

    const result = await service.getSearchTimeline("libr", "2026-03-01", "2026-03-31", "day", "user-1");

    // Sparse (no 2026-03-03..09 zero buckets), sorted, same-day rows folded.
    expect(result.buckets).toEqual([
      { date: "2026-03-02", total: 5, count: 1 },
      { date: "2026-03-10", total: 10.3, count: 2 },
    ]);
    expect(result.summary).toEqual({ total: 15.3, count: 3, firstDate: "2026-03-02", lastDate: "2026-03-10" });
  });

  it("buckets by calendar week keyed on its Sunday (Sun→Sat, like the rest of the app)", async () => {
    const decimal = (v: string) => ({ toString: () => v });
    const { service } = makeService([
      // 2026-03-02 is a Monday → week of Sunday 2026-03-01.
      { date: new Date("2026-03-02T12:00:00.000Z"), amount: decimal("10") },
      // 2026-03-07 is the Saturday of that same week.
      { date: new Date("2026-03-07T12:00:00.000Z"), amount: decimal("20") },
      // 2026-03-08 is the next Sunday → its own week.
      { date: new Date("2026-03-08T00:00:00.000Z"), amount: decimal("40") },
    ]);

    const result = await service.getSearchTimeline("libr", "2026-03-01", "2026-03-31", "week", "user-1");

    expect(result.buckets).toEqual([
      { date: "2026-03-01", total: 30, count: 2 },
      { date: "2026-03-08", total: 40, count: 1 },
    ]);
    expect(result.summary).toEqual({ total: 70, count: 3, firstDate: "2026-03-02", lastDate: "2026-03-08" });
  });

  it("returns the empty summary when nothing matches in the window", async () => {
    const { service } = makeService([]);

    await expect(service.getSearchTimeline("libr", "2026-01-01", "2026-12-31", "week", "user-1")).resolves.toEqual(
      emptyResponse,
    );
  });
});
