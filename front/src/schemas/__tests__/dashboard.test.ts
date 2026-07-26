import { MonthlyStatsSchema } from "@src/schemas/dashboard";

/**
 * The /monthlystats contract (COS-179). This query is not in `throwOnError:
 * false`, so a parse failure blanks the Dashboard *and* the Spendings page —
 * these lock the shape the backend must keep sending.
 */
describe("MonthlyStatsSchema", () => {
  it("parses the two totals as bare numbers", () => {
    expect(MonthlyStatsSchema.parse({ spendingsSum: 842.17, recurringsSum: 1250 })).toEqual({
      spendingsSum: 842.17,
      recurringsSum: 1250,
    });
  });

  it("coerces string totals, since Prisma Decimals serialise either way", () => {
    expect(MonthlyStatsSchema.parse({ spendingsSum: "842.17", recurringsSum: "1250" })).toEqual({
      spendingsSum: 842.17,
      recurringsSum: 1250,
    });
  });

  it("rejects the pre-COS-179 wrapper shape", () => {
    expect(() =>
      MonthlyStatsSchema.parse({ spendingsSum: { amount: 842.17 }, recurringsSum: { amount: 1250 } }),
    ).toThrow();
  });

  it("rejects a missing or non-numeric total instead of defaulting it to 0", () => {
    expect(() => MonthlyStatsSchema.parse({ spendingsSum: 842.17 })).toThrow();
    expect(() => MonthlyStatsSchema.parse({ spendingsSum: 842.17, recurringsSum: null })).toThrow();
    expect(() => MonthlyStatsSchema.parse({ spendingsSum: 842.17, recurringsSum: "n/a" })).toThrow();
  });
});
