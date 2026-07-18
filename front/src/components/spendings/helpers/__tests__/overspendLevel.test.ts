import overspendLevel, { OVERSPEND_DANGER_RATIO } from "@components/spendings/helpers/overspendLevel";

describe("overspendLevel", () => {
  it("is normal when the budget is null or non-positive (no ceiling defined)", () => {
    expect(overspendLevel(999, null)).toBe("normal");
    expect(overspendLevel(999, 0)).toBe("normal");
    expect(overspendLevel(999, -50)).toBe("normal");
  });

  it("is normal at or under budget", () => {
    expect(overspendLevel(0, 100)).toBe("normal");
    expect(overspendLevel(99, 100)).toBe("normal");
    expect(overspendLevel(100, 100)).toBe("normal");
  });

  it("is warn just over budget, up to the danger multiple", () => {
    expect(overspendLevel(101, 100)).toBe("warn");
    expect(overspendLevel(100 * OVERSPEND_DANGER_RATIO, 100)).toBe("warn");
  });

  it("is danger past the danger multiple of budget", () => {
    expect(overspendLevel(100 * OVERSPEND_DANGER_RATIO + 1, 100)).toBe("danger");
    expect(overspendLevel(1000, 100)).toBe("danger");
  });
});
