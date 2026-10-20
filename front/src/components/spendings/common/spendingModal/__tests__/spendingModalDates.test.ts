import { initialSpendingDate, recurringCopyDates } from "@components/spendings/common/spendingModal/spendingModalDates";
import { describe, expect, it } from "vitest";

import type { SpendingListItem } from "@components/spendings/interfaces/spendingListTypes";

describe("initialSpendingDate", () => {
  it("keeps the edited spending's own day", () => {
    expect(initialSpendingDate({ date: "2026-10-18T00:00:00.000Z" } as SpendingListItem, new Date(2026, 9, 1))).toBe(
      "2026-10-18",
    );
  });

  it("falls back to the day the modal was opened on", () => {
    expect(initialSpendingDate(null, new Date(2026, 9, 5))).toBe("2026-10-05");
  });
});

describe("recurringCopyDates", () => {
  it("gives the month's bounds and the previous month's, end of month included", () => {
    expect(recurringCopyDates(new Date(2026, 9, 20))).toEqual({
      start: "2026-10-01",
      end: "2026-10-31",
      previousMonthStart: "2026-09-01",
      previousMonthEnd: "2026-09-30",
    });
  });
});
