import { actionColor } from "@lib/panel/actionColors";
import { describe, expect, it } from "vitest";

describe("actionColor", () => {
  const names = ["spending.add", "receipt.upload", "dashboard.view"];

  it("gives each action the series of its place in the registry, cycling past six", () => {
    expect(actionColor(names, "spending.add")).toBe("var(--series-1)");
    expect(actionColor(names, "dashboard.view")).toBe("var(--series-3)");
    expect(actionColor(["a", "b", "c", "d", "e", "f", "g"], "g")).toBe("var(--series-1)");
  });

  it("falls back to the first series for an action the registry no longer has", () => {
    expect(actionColor(names, "gone")).toBe("var(--series-1)");
  });
});
