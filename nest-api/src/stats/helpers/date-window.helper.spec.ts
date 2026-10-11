import { dateWindow } from "@stats/helpers/date-window.helper";

describe("dateWindow", () => {
  it("is undefined when neither bound is given (all-time)", () => {
    expect(dateWindow()).toBeUndefined();
  });

  it("turns inclusive calendar bounds into a half-open UTC range", () => {
    expect(dateWindow("2026-01-01", "2026-07-19")).toEqual({
      gte: new Date(Date.UTC(2026, 0, 1)),
      lt: new Date(Date.UTC(2026, 6, 20)),
    });
  });

  it("supports an open-ended window", () => {
    expect(dateWindow("2026-01-01")).toEqual({ gte: new Date(Date.UTC(2026, 0, 1)) });
    expect(dateWindow(undefined, "2026-12-31")).toEqual({ lt: new Date(Date.UTC(2027, 0, 1)) });
  });
});
