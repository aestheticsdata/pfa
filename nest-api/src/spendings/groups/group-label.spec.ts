import { composeGroupLineLabel, isSameDay } from "@spendings/groups/group-label";

describe("composeGroupLineLabel", () => {
  it("joins the group name and the detail", () => {
    expect(composeGroupLineLabel("Store", "Groceries")).toBe("Store — Groceries");
  });

  it("falls back to the group name without a detail", () => {
    expect(composeGroupLineLabel("Store", "")).toBe("Store");
    expect(composeGroupLineLabel("Store", "   ")).toBe("Store");
    expect(composeGroupLineLabel("Store", null)).toBe("Store");
  });

  it("trims both parts", () => {
    expect(composeGroupLineLabel("  Store ", " Soap ")).toBe("Store — Soap");
  });
});

describe("isSameDay", () => {
  it("compares the calendar day only", () => {
    expect(isSameDay(new Date("2026-05-04T00:00:00Z"), new Date("2026-05-04T00:00:00Z"))).toBe(true);
    expect(isSameDay(new Date("2026-05-04T00:00:00Z"), new Date("2026-05-05T00:00:00Z"))).toBe(false);
  });
});
