import { planRamp } from "@core/engine/ramp";
import { describe, expect, it } from "vitest";

const ORDER = ["l1", "l2", "l3", "l4", "l5", "l6"];

describe("planRamp", () => {
  it("brings bots up a step at a time, in order, only when a step is due", () => {
    const base = { order: ORDER, target: 5, enabled: true, step: 2 };
    expect(planRamp({ ...base, spawned: new Set(), stepDue: true })).toEqual({ spawn: ["l1", "l2"], despawn: [] });
    expect(planRamp({ ...base, spawned: new Set(["l1", "l2"]), stepDue: false })).toEqual({ spawn: [], despawn: [] });
    expect(planRamp({ ...base, spawned: new Set(["l1", "l2", "l3", "l4"]), stepDue: true }).spawn).toEqual(["l5"]);
  });

  it("stops the excess at once, highest first, when the target drops", () => {
    const plan = planRamp({
      order: ORDER,
      spawned: new Set(["l1", "l2", "l3", "l4"]),
      target: 1,
      enabled: true,
      stepDue: false,
      step: 10,
    });
    expect(plan).toEqual({ spawn: [], despawn: ["l4", "l3", "l2"] });
  });

  it("stops every load bot when switched off, whatever the target", () => {
    const plan = planRamp({
      order: ORDER,
      spawned: new Set(["l1", "l2"]),
      target: 6,
      enabled: false,
      stepDue: true,
      step: 5,
    });
    expect(plan).toEqual({ spawn: [], despawn: ["l2", "l1"] });
  });

  it("drops a bot blocked since it came up, and does not bring blocked ones up", () => {
    const plan = planRamp({
      order: ["l1", "l3"],
      spawned: new Set(["l1", "l2"]),
      target: 3,
      enabled: true,
      stepDue: true,
      step: 5,
    });
    expect(plan).toEqual({ spawn: ["l3"], despawn: ["l2"] });
  });
});
