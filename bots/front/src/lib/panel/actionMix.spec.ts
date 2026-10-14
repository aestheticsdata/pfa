import { mixEntries } from "@lib/panel/actionMix";
import { describe, expect, it } from "vitest";

import type { ActionView } from "@contracts/interfaces/panelTypes";

const view = (name: string): ActionView => ({
  name,
  description: "",
  weight: 1,
  enabled: true,
  quiet: false,
  budget: false,
  perMin: 1,
  errorRate: 0,
});

describe("mixEntries", () => {
  it("keeps the actions that ran, busiest first, colour by registry place, share of all runs", () => {
    const entries = mixEntries(
      [
        { name: "dashboard.view", count: 25 },
        { name: "receipt.upload", count: 0 },
        { name: "spending.add", count: 75 },
      ],
      [view("dashboard.view"), view("spending.add")],
    );
    expect(entries.map((entry) => [entry.name, entry.share, entry.color])).toEqual([
      ["spending.add", 75, "var(--series-3)"],
      ["dashboard.view", 25, "var(--series-1)"],
    ]);
    expect(entries[0]?.action?.name).toBe("spending.add");
  });
});
