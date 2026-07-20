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
