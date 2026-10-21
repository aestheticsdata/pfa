import { SpendingsStatsService } from "@stats/services/spendings-stats.service";

/**
 * Unit tests for SpendingsStatsService.getCategoryTrends — the per-category two-window
 * aggregate backing the dashboard's monthly trend column + "Catégorie en hausse"
 * insight (COS-41) and the Dépenses weekly breakdown + avg/day delta (COS-35).
 * Prisma is mocked, so these assert the two query shapes, the category-name
 * resolution, the current↔previous pairing (incl. the null "nouv." case), and
 * the comparison-window `previousTotal` — without touching the DB. The delta %
 * lives on the front.
 */
describe("SpendingsStatsService.getCategoryTrends", () => {
  // groupBy is called twice (current window then previous); findMany resolves
  // names/colours for the current window's categories.
  const makeService = (current: unknown[], previous: unknown[], categories: unknown[] = []) => {
    const groupBy = jest.fn().mockResolvedValueOnce(current).mockResolvedValueOnce(previous);
    const findMany = jest.fn().mockResolvedValue(categories);
    const prisma = { spendings: { groupBy }, categories: { findMany } } as unknown as never;
    return { service: new SpendingsStatsService(prisma), groupBy, findMany };
  };

  const args = [
    "user-1",
    { from: "2026-07-01", to: "2026-07-31", prevFrom: "2026-06-01", prevTo: "2026-06-30" },
  ] as const;

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
 * Unit tests for SpendingsStatsService.getBusiestWeek — the calendar week-range of a month
 * with the most one-off spendings, backing the dashboard's 4th ribbon insight
 * (COS-139). "Week" = the month's calendar-aligned Sun→Sat ranges truncated at
 * the month edges (the same slices the app shows everywhere), NOT a rolling
 * window. Prisma is mocked; these assert the query shape (per-day counts over a
 * half-open UTC month range) and the JS bucketing/max/tie-break.
 */
describe("SpendingsStatsService.getBusiestWeek", () => {
  const makeService = (groupByResult: { date: Date; _count: number }[]) => {
    const groupBy = jest.fn().mockResolvedValue(groupByResult);
    const prisma = { spendings: { groupBy } } as unknown as never;
    return { service: new SpendingsStatsService(prisma), groupBy };
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
 * Unit tests for SpendingsStatsService.getSpendingPace — the totals of the three months
 * before a reference month, backing the dashboard's "Sur le rythme" insight
 * (COS-40). Prisma is mocked, so these assert the (half-open, UTC) query shape
 * and the newest→oldest transformation without a DB.
 */
describe("SpendingsStatsService.getSpendingPace", () => {
  const makeService = (totals: number[]) => {
    // One aggregate call per month back (M-1, M-2, M-3), resolved in call order.
    const aggregate = jest.fn();
    for (const total of totals) aggregate.mockResolvedValueOnce({ _sum: { amount: total } });
    const prisma = { spendings: { aggregate } } as unknown as never;
    return { service: new SpendingsStatsService(prisma), aggregate };
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
 * Unit tests for SpendingsStatsService.getMonthlyStats — the two halves of a month's
 * total spend (one-off spendings + that month's fixed expenses), backing the
 * dashboard's "spent this month" and remaining-budget figures. Prisma is mocked;
 * these assert the query shape and the flat `{ spendingsSum, recurringsSum }`
 * contract introduced by COS-179.
 */
describe("SpendingsStatsService.getMonthlyStats", () => {
  const makeService = (spendingsTotal: unknown, recurringsTotal: unknown) => {
    const spendingsAggregate = jest.fn().mockResolvedValue({ _sum: { amount: spendingsTotal } });
    const recurringsAggregate = jest.fn().mockResolvedValue({ _sum: { amount: recurringsTotal } });
    const prisma = {
      spendings: { aggregate: spendingsAggregate },
      recurrings: { aggregate: recurringsAggregate },
    } as unknown as never;
    return { service: new SpendingsStatsService(prisma), spendingsAggregate, recurringsAggregate };
  };

  it("sums the month's spendings over an inclusive range and its recurrings on their exact bounds", async () => {
    const { service, spendingsAggregate, recurringsAggregate } = makeService(0, 0);

    await service.getMonthlyStats("2026-06-15", "user-1");

    // Recurrings carry the month bounds as their own columns — matched exactly,
    // not as a range, since one row spans the whole month.
    expect(recurringsAggregate).toHaveBeenCalledWith({
      where: {
        userID: "user-1",
        dateFrom: new Date(Date.UTC(2026, 5, 1)),
        dateTo: new Date(Date.UTC(2026, 5, 30)),
      },
      _sum: { amount: true },
    });
    expect(spendingsAggregate).toHaveBeenCalledWith({
      where: {
        userID: "user-1",
        date: { gte: new Date(Date.UTC(2026, 5, 1)), lte: new Date(Date.UTC(2026, 5, 30)) },
      },
      _sum: { amount: true },
    });
  });

  it("returns both totals as bare numbers", async () => {
    const { service } = makeService(842.17, 1250);

    await expect(service.getMonthlyStats("2026-06-15", "user-1")).resolves.toEqual({
      spendingsSum: 842.17,
      recurringsSum: 1250,
    });
  });

  it("reports 0 on each side when the month is empty", async () => {
    const { service } = makeService(null, null);

    await expect(service.getMonthlyStats("2026-06-15", "user-1")).resolves.toEqual({
      spendingsSum: 0,
      recurringsSum: 0,
    });
  });

  it("coerces Prisma Decimal sums and rounds them to the cent", async () => {
    const decimal = (value: string) => ({ toString: () => value }) as unknown as number;
    const { service } = makeService(decimal("120.005"), decimal("99.999"));

    await expect(service.getMonthlyStats("2026-06-15", "user-1")).resolves.toEqual({
      spendingsSum: 120.01,
      recurringsSum: 100,
    });
  });
});
