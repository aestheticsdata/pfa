import { Rng } from "@core/random/rng";
import { describe, expect, it } from "vitest";

describe("Rng", () => {
  it("replays the same sequence for the same seed", () => {
    const a = new Rng("pfa:ceres");
    const b = new Rng("pfa:ceres");
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });

  it("spreads the first draws of similar seeds over [0, 1)", () => {
    const firsts = Array.from({ length: 400 }, (_, i) => new Rng(`pfa:bot-${i}`).next());
    const buckets = [0, 0, 0, 0];
    for (const value of firsts) {
      buckets[Math.floor(value * 4)] = (buckets[Math.floor(value * 4)] ?? 0) + 1;
    }
    for (const count of buckets) {
      expect(count).toBeGreaterThan(70);
      expect(count).toBeLessThan(130);
    }
  });

  it("never picks a zero-weight item", () => {
    const rng = new Rng(1);
    for (let i = 0; i < 200; i++) {
      expect(rng.weighted(["a", "b"], (item) => (item === "a" ? 0 : 1))).toBe("b");
    }
    expect(rng.weighted(["a"], () => 0)).toBeUndefined();
  });
});
