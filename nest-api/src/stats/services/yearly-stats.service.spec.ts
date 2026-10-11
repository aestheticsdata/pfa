import { YearlyStatsService } from "@stats/services/yearly-stats.service";

/**
 * Unit tests for YearlyStatsService.getDailyStats — the per-day spending totals for a
 * year backing the daily heatmap (COS-45) and the day-of-week averages (COS-48).
 * Prisma is mocked; these assert the query range/scoping and the JS bucketing.
 */
describe("YearlyStatsService.getDailyStats", () => {
  const makeService = (findManyResult: { date: Date; amount: unknown }[]) => {
    const findMany = jest.fn().mockResolvedValue(findManyResult);
    const prisma = { spendings: { findMany } } as unknown as never;
    return { service: new YearlyStatsService(prisma), findMany };
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
 * Unit tests for YearlyStatsService.getBiggestRegularExpense — the single biggest
 * one-off (non-exceptional) expense of a year, backing the "courante" row of the
 * Statistiques "Plus grosse dépense" KPI card (COS-46). Prisma is mocked; these
 * assert the query shape (max-amount row in the Spendings table only) and the
 * mapping to the response envelope.
 */
describe("YearlyStatsService.getBiggestRegularExpense", () => {
  const makeService = (findFirstResult: unknown) => {
    const findFirst = jest.fn().mockResolvedValue(findFirstResult);
    const prisma = { spendings: { findFirst } } as unknown as never;
    return { service: new YearlyStatsService(prisma), findFirst };
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
 * Unit tests for YearlyStatsService.getWeekdayCategories — the dominant spending
 * category per weekday for a year, backing the day-of-week widget's hover tooltip
 * (COS-127). Prisma is mocked; these assert the query shape (categorized
 * Spendings over a half-open UTC year range) and the JS weekday×category
 * bucketing / winner selection.
 */
describe("YearlyStatsService.getWeekdayCategories", () => {
  const emptyWeekdays = () => Array.from({ length: 7 }, () => ({ name: null, color: null }));

  const makeService = (spendingRows: unknown[], categories: unknown[] = []) => {
    const spendingsFindMany = jest.fn().mockResolvedValue(spendingRows);
    const categoriesFindMany = jest.fn().mockResolvedValue(categories);
    const prisma = {
      spendings: { findMany: spendingsFindMany },
      categories: { findMany: categoriesFindMany },
    } as unknown as never;
    return { service: new YearlyStatsService(prisma), spendingsFindMany, categoriesFindMany };
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
 * Unit tests for YearlyStatsService.getSearchTimeline — the time distribution of the
 * spendings matching a search term (COS-160). Prisma is mocked; these assert
 * the shared search where clause, the day/week bucketisation and the summary.
 */
describe("YearlyStatsService.getSearchTimeline", () => {
  const makeService = (rows: { date: Date; amount: unknown }[]) => {
    const findMany = jest.fn().mockResolvedValue(rows);
    // Only spendings.findMany is exercised; cast keeps the mock minimal.
    const prisma = { spendings: { findMany } } as unknown as never;
    return { service: new YearlyStatsService(prisma), findMany };
  };

  const emptyResponse = { buckets: [], summary: { total: 0, count: 0, firstDate: null, lastDate: null } };

  it("returns empty without hitting the DB when the trimmed query is shorter than 2 chars", async () => {
    const { service, findMany } = makeService([]);

    await expect(
      service.getSearchTimeline({ q: " a ", from: "2026-01-01", to: "2026-12-31", bucket: "day" }, "user-1"),
    ).resolves.toEqual(emptyResponse);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("queries the shared search clause, scoped to the user, over an inclusive UTC window", async () => {
    const { service, findMany } = makeService([]);

    await service.getSearchTimeline(
      { q: " librairie ", from: "2026-01-01", to: "2026-07-19", bucket: "day" },
      "user-1",
    );

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

    await service.getSearchTimeline({ q: "100%_x", from: "2026-01-01", to: "2026-12-31", bucket: "day" }, "user-1");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ label: { contains: "100\\%\\_x" } }, { category: { is: { name: { contains: "100\\%\\_x" } } } }],
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

    const result = await service.getSearchTimeline(
      { q: "libr", from: "2026-03-01", to: "2026-03-31", bucket: "day" },
      "user-1",
    );

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

    const result = await service.getSearchTimeline(
      { q: "libr", from: "2026-03-01", to: "2026-03-31", bucket: "week" },
      "user-1",
    );

    expect(result.buckets).toEqual([
      { date: "2026-03-01", total: 30, count: 2 },
      { date: "2026-03-08", total: 40, count: 1 },
    ]);
    expect(result.summary).toEqual({ total: 70, count: 3, firstDate: "2026-03-02", lastDate: "2026-03-08" });
  });

  it("returns the empty summary when nothing matches in the window", async () => {
    const { service } = makeService([]);

    await expect(
      service.getSearchTimeline({ q: "libr", from: "2026-01-01", to: "2026-12-31", bucket: "week" }, "user-1"),
    ).resolves.toEqual(emptyResponse);
  });
});
