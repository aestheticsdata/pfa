import { SpendingsService } from "./spendings.service";

/**
 * Unit tests for SpendingsService.searchSpendings — the whole-history, keyset-
 * paginated text search backing the Dashboard "Rechercher une dépense" modal
 * (COS-114). Prisma is mocked, so these assert the query shape and the JS
 * transformation without touching the DB.
 */
describe("SpendingsService.searchSpendings", () => {
  const makeService = (findManyResult: unknown[], countResult = 0) => {
    const findMany = jest.fn().mockResolvedValue(findManyResult);
    const count = jest.fn().mockResolvedValue(countResult);
    // Only spendings.findMany / count are exercised; the other deps are unused.
    const prisma = { spendings: { findMany, count } } as unknown as never;
    const service = new SpendingsService(prisma, {} as never, {} as never);
    return { service, findMany, count };
  };

  const makeRow = (ID: string) => ({
    ID,
    userID: "user-1",
    label: `row-${ID}`,
    amount: 1,
    date: new Date("2026-01-01"),
    category: null,
  });

  it("returns empty without hitting the DB when the trimmed query is shorter than 2 chars", async () => {
    const { service, findMany, count } = makeService([]);

    await expect(service.searchSpendings(" a ", "user-1")).resolves.toEqual({
      items: [],
      nextCursor: null,
      total: 0,
    });

    expect(findMany).not.toHaveBeenCalled();
    expect(count).not.toHaveBeenCalled();
  });

  it("fetches the first page: label OR category name, scoped to the user, newest-first with ID tiebreaker, no cursor", async () => {
    const { service, findMany, count } = makeService([], 12);

    const result = await service.searchSpendings("carre", "user-1");

    const where = {
      userID: "user-1",
      OR: [{ label: { contains: "carre" } }, { category: { is: { name: { contains: "carre" } } } }],
    };
    expect(findMany).toHaveBeenCalledWith({
      where,
      orderBy: [{ date: "desc" }, { ID: "desc" }],
      include: { category: true },
      // Over-fetch one row to detect a further page without a spurious empty call.
      take: 51,
    });
    // First page has no cursor / skip.
    expect(findMany.mock.calls[0][0]).not.toHaveProperty("cursor");
    expect(findMany.mock.calls[0][0]).not.toHaveProperty("skip");
    // The unbounded total is counted once, on the first page.
    expect(count).toHaveBeenCalledWith({ where });
    expect(result.total).toBe(12);
  });

  it("continues from a cursor and does NOT recount the total on later pages", async () => {
    const { service, findMany, count } = makeService([], 0);

    const result = await service.searchSpendings("carre", "user-1", "cursor-id");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 51, cursor: { ID: "cursor-id" }, skip: 1 }),
    );
    expect(count).not.toHaveBeenCalled();
    expect(result.total).toBeUndefined();
  });

  it("returns one page and a nextCursor when the over-fetch row shows more remain", async () => {
    // 51 rows come back (page size + 1 probe) → page is 50 rows, more follow.
    const overFetched = Array.from({ length: 51 }, (_, i) => makeRow(`s${i}`));
    const { service } = makeService(overFetched, 120);

    const result = await service.searchSpendings("carre", "user-1");

    expect(result.items).toHaveLength(50);
    expect(result.items.at(-1)?.ID).toBe("s49");
    expect(result.nextCursor).toBe("s49");
  });

  it("sets nextCursor to null when the over-fetch row is absent (end of results)", async () => {
    // Exactly page size → no extra row → last page, no spurious next fetch.
    const lastPage = Array.from({ length: 50 }, (_, i) => makeRow(`s${i}`));
    const { service } = makeService(lastPage, 50);

    const result = await service.searchSpendings("carre", "user-1");

    expect(result.items).toHaveLength(50);
    expect(result.nextCursor).toBeNull();
  });

  it("trims the query before matching", async () => {
    const { service, findMany } = makeService([]);

    await service.searchSpendings("  carrefour  ", "user-1");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ label: { contains: "carrefour" } }, { category: { is: { name: { contains: "carrefour" } } } }],
        }),
      }),
    );
  });

  it("escapes LIKE wildcards so % and _ match literally", async () => {
    const { service, findMany } = makeService([]);

    await service.searchSpendings("100%_x", "user-1");

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

  it("adds a half-open year date range to the where clause when a year is given", async () => {
    const { service, findMany } = makeService([]);

    await service.searchSpendings("carre", "user-1", undefined, "2025");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: {
            gte: new Date("2025-01-01T00:00:00.000Z"),
            lt: new Date("2026-01-01T00:00:00.000Z"),
          },
        }),
      }),
    );
  });

  it("allows a year-only query (short/empty text) to still search, without a text OR clause", async () => {
    const { service, findMany } = makeService([]);

    await service.searchSpendings("", "user-1", undefined, "2025");

    expect(findMany).toHaveBeenCalled();
    expect(findMany.mock.calls[0][0].where).not.toHaveProperty("OR");
    expect(findMany.mock.calls[0][0].where).toHaveProperty("date");
  });

  it("ignores a non-numeric year and, with too-short text, searches nothing", async () => {
    const { service, findMany } = makeService([]);

    const result = await service.searchSpendings("a", "user-1", undefined, "abc");

    expect(findMany).not.toHaveBeenCalled();
    expect(result).toEqual({ items: [], nextCursor: null, total: 0 });
  });

  it("flattens the category to name/color", async () => {
    const row = {
      ID: "s1",
      userID: "user-1",
      label: "Carrefour Market",
      amount: 42.8,
      date: new Date("2026-05-03"),
      category: { userID: "user-1", name: "Courses", color: "#0F6E56" },
    };
    const { service } = makeService([row], 1);

    const result = await service.searchSpendings("carre", "user-1");

    expect(result.items[0]).toMatchObject({
      ID: "s1",
      label: "Carrefour Market",
      category: "Courses",
      categoryColor: "#0F6E56",
    });
    // The nested relation object is flattened away, not leaked.
    expect(result.items[0]).not.toHaveProperty("category.name");
  });

  it("nulls a category that belongs to another user (defensive, mirrors getSpendings)", async () => {
    const row = {
      ID: "s1",
      userID: "user-1",
      label: "Secret",
      amount: 1,
      date: new Date("2026-01-01"),
      category: { userID: "other-user", name: "Secret", color: "#000000" },
    };
    const { service } = makeService([row], 1);

    const result = await service.searchSpendings("sec", "user-1");

    expect(result.items[0].category).toBeNull();
    expect(result.items[0].categoryColor).toBeNull();
  });

  it("keeps a shared (userID null) category", async () => {
    const row = {
      ID: "s1",
      userID: "user-1",
      label: "Loyer",
      amount: 500,
      date: new Date("2026-01-01"),
      category: { userID: null, name: "Logement", color: "#185FA5" },
    };
    const { service } = makeService([row], 1);

    const result = await service.searchSpendings("loy", "user-1");

    expect(result.items[0].category).toBe("Logement");
    expect(result.items[0].categoryColor).toBe("#185FA5");
  });
});

describe("SpendingsService.getSpendingYears", () => {
  const makeYearsService = (aggregateResult: unknown) => {
    const aggregate = jest.fn().mockResolvedValue(aggregateResult);
    const prisma = { spendings: { aggregate } } as unknown as never;
    const service = new SpendingsService(prisma, {} as never, {} as never);
    return { service, aggregate };
  };

  it("returns the years spanned by the data, newest first, scoped to the user", async () => {
    const { service, aggregate } = makeYearsService({
      _min: { date: new Date("2023-03-10") },
      _max: { date: new Date("2026-07-01") },
    });

    const years = await service.getSpendingYears("user-1");

    expect(aggregate).toHaveBeenCalledWith({
      where: { userID: "user-1" },
      _min: { date: true },
      _max: { date: true },
    });
    expect(years).toEqual([2026, 2025, 2024, 2023]);
  });

  it("returns a single year when min and max fall in the same year", async () => {
    const { service } = makeYearsService({
      _min: { date: new Date("2026-02-01") },
      _max: { date: new Date("2026-11-30") },
    });

    await expect(service.getSpendingYears("user-1")).resolves.toEqual([2026]);
  });

  it("returns an empty array when the user has no spendings", async () => {
    const { service } = makeYearsService({ _min: { date: null }, _max: { date: null } });

    await expect(service.getSpendingYears("user-1")).resolves.toEqual([]);
  });
});
