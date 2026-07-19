import { DashboardService } from "./dashboard.service";

/**
 * Unit tests for DashboardService.getDailyProjection — the reference-period
 * resolver backing the Dashboard sparkline projection (COS-27). It walks the
 * GLOBAL projection chain (same month N-1 → same month N-2 → previous month M-1
 * → none) and returns the chosen month's day-by-day totals. Prisma is mocked, so
 * these assert the query window per candidate and the day-of-month aggregation
 * without touching the DB.
 */
describe("DashboardService.getDailyProjection", () => {
  const makeService = (findMany: jest.Mock) => {
    // Only spendings.findMany is exercised by getDailyProjection.
    const prisma = { spendings: { findMany } } as unknown as never;
    return new DashboardService(prisma);
  };

  const row = (date: string, amount: number) => ({ date: new Date(date), amount });

  it("uses the same month last year (N-1) when it has spendings, aggregated by day-of-month", async () => {
    const findMany = jest.fn().mockResolvedValueOnce([row("2025-03-02", 10), row("2025-03-02", 5), row("2025-03-10", 20)]);
    const service = makeService(findMany);

    const result = await service.getDailyProjection("2026-03-01", "user-1");

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: { userID: "user-1", date: { gte: new Date(Date.UTC(2025, 2, 1)), lt: new Date(Date.UTC(2025, 3, 1)) } },
      select: { date: true, amount: true },
    });
    expect(result.source).toBe("sameMonthLastYear");
    expect(result.referenceMonth).toBe("2025-03-01");
    expect(result.dailyTotals).toHaveLength(31); // March
    expect(result.dailyTotals[1]).toBe(15); // day 2 → 10 + 5
    expect(result.dailyTotals[9]).toBe(20); // day 10
    expect(result.dailyTotals[0]).toBe(0); // day 1 → untouched
  });

  it("falls back to the same month two years ago (N-2) when N-1 is empty", async () => {
    const findMany = jest
      .fn()
      .mockResolvedValueOnce([]) // N-1 (March 2025) empty
      .mockResolvedValueOnce([row("2024-03-05", 7)]); // N-2 (March 2024) has data
    const service = makeService(findMany);

    const result = await service.getDailyProjection("2026-03-01", "user-1");

    expect(findMany).toHaveBeenCalledTimes(2);
    expect(findMany.mock.calls[1][0].where.date).toEqual({
      gte: new Date(Date.UTC(2024, 2, 1)),
      lt: new Date(Date.UTC(2024, 3, 1)),
    });
    expect(result.source).toBe("sameMonthTwoYearsAgo");
    expect(result.referenceMonth).toBe("2024-03-01");
    expect(result.dailyTotals[4]).toBe(7); // day 5
  });

  it("falls back to the previous month (M-1) when no previous year has data", async () => {
    const findMany = jest
      .fn()
      .mockResolvedValueOnce([]) // N-1
      .mockResolvedValueOnce([]) // N-2
      .mockResolvedValueOnce([row("2026-02-14", 42)]); // M-1 (Feb 2026)
    const service = makeService(findMany);

    const result = await service.getDailyProjection("2026-03-01", "user-1");

    expect(findMany).toHaveBeenCalledTimes(3);
    expect(result.source).toBe("previousMonth");
    expect(result.referenceMonth).toBe("2026-02-01");
    expect(result.dailyTotals).toHaveLength(28); // Feb 2026
    expect(result.dailyTotals[13]).toBe(42); // day 14
  });

  it("returns 'none' at the very first month of data (no reference anywhere) — never an average fallback", async () => {
    const findMany = jest.fn().mockResolvedValue([]); // every candidate empty
    const service = makeService(findMany);

    const result = await service.getDailyProjection("2026-03-01", "user-1");

    expect(findMany).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ source: "none", referenceMonth: null, dailyTotals: [] });
  });

  it("resolves the previous month across the year boundary (January → previous December)", async () => {
    const findMany = jest
      .fn()
      .mockResolvedValueOnce([]) // N-1 (Jan 2025)
      .mockResolvedValueOnce([]) // N-2 (Jan 2024)
      .mockResolvedValueOnce([row("2025-12-31", 9)]); // M-1 = Dec 2025
    const service = makeService(findMany);

    const result = await service.getDailyProjection("2026-01-01", "user-1");

    expect(findMany.mock.calls[2][0].where.date).toEqual({
      gte: new Date(Date.UTC(2025, 11, 1)),
      lt: new Date(Date.UTC(2026, 0, 1)),
    });
    expect(result.source).toBe("previousMonth");
    expect(result.referenceMonth).toBe("2025-12-01");
    expect(result.dailyTotals).toHaveLength(31); // December
    expect(result.dailyTotals[30]).toBe(9); // day 31
  });
});

/**
 * Unit tests for DashboardService.getMonthlyIncome — the per-month income series
 * backing the monthly chart's stepped budget line (COS-50). Prisma is mocked, so
 * these assert the query window and the month-of-year bucketing.
 */
describe("DashboardService.getMonthlyIncome", () => {
  const makeService = (findMany: jest.Mock) => {
    const prisma = { dashboards: { findMany } } as unknown as never;
    return new DashboardService(prisma);
  };

  const row = (dateFrom: string, initialAmount: number | string) => ({ dateFrom: new Date(dateFrom), initialAmount });

  it("returns a 12-slot array keyed by the dashboard month, null where absent", async () => {
    const findMany = jest.fn().mockResolvedValue([row("2026-01-01", 3000), row("2026-03-01", 3200), row("2026-12-01", 3500)]);
    const service = makeService(findMany);

    const result = await service.getMonthlyIncome("2026", "user-1");

    expect(findMany).toHaveBeenCalledWith({
      where: { userID: "user-1", dateFrom: { gte: new Date(Date.UTC(2026, 0, 1)), lt: new Date(Date.UTC(2027, 0, 1)) } },
      select: { dateFrom: true, initialAmount: true },
    });
    expect(result.income).toEqual([3000, null, 3200, null, null, null, null, null, null, null, null, 3500]);
  });

  it("returns all nulls for an invalid year without querying", async () => {
    const findMany = jest.fn();
    const service = makeService(findMany);

    const result = await service.getMonthlyIncome("nope", "user-1");

    expect(findMany).not.toHaveBeenCalled();
    expect(result.income).toEqual(Array(12).fill(null));
  });

  it("coerces Prisma Decimal amounts (and keeps a real zero)", async () => {
    const findMany = jest.fn().mockResolvedValue([row("2026-06-01", 0), row("2026-07-01", "2750.50")]);
    const service = makeService(findMany);

    const result = await service.getMonthlyIncome("2026", "user-1");

    expect(result.income[5]).toBe(0);
    expect(result.income[6]).toBe(2750.5);
  });
});
