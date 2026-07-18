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
