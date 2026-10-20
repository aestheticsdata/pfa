import { OVERSPEND_LEVEL } from "@components/spendings/config/constants";
import overspendLevel, { OVERSPEND_DANGER_RATIO } from "@components/spendings/helpers/overspendLevel";
import { describe, expect, it } from "vitest";

describe("overspendLevel", () => {
  it("is normal when the budget is null or non-positive (no ceiling defined)", () => {
    expect(overspendLevel(999, null)).toBe(OVERSPEND_LEVEL.normal);
    expect(overspendLevel(999, 0)).toBe(OVERSPEND_LEVEL.normal);
    expect(overspendLevel(999, -50)).toBe(OVERSPEND_LEVEL.normal);
  });

  it("is normal at or under budget", () => {
    expect(overspendLevel(0, 100)).toBe(OVERSPEND_LEVEL.normal);
    expect(overspendLevel(99, 100)).toBe(OVERSPEND_LEVEL.normal);
    expect(overspendLevel(100, 100)).toBe(OVERSPEND_LEVEL.normal);
  });

  it("is warn just over budget, up to the danger multiple", () => {
    expect(overspendLevel(101, 100)).toBe(OVERSPEND_LEVEL.warn);
    expect(overspendLevel(100 * OVERSPEND_DANGER_RATIO, 100)).toBe(OVERSPEND_LEVEL.warn);
  });

  it("is danger past the danger multiple of budget", () => {
    expect(overspendLevel(100 * OVERSPEND_DANGER_RATIO + 1, 100)).toBe(OVERSPEND_LEVEL.danger);
    expect(overspendLevel(1000, 100)).toBe(OVERSPEND_LEVEL.danger);
  });
});
