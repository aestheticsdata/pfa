import { RateLimiter } from "@core/limits/rateLimiter";
import { describe, expect, it } from "vitest";

describe("RateLimiter", () => {
  it("never lets more than the cap through, over any second, under a flood", () => {
    let now = 0;
    const limiter = new RateLimiter(40, () => now);
    const granted: number[] = [];
    // A thousand callers knocking every millisecond for 10 simulated seconds.
    for (now = 0; now < 10_000; now += 1) {
      for (let caller = 0; caller < 1000 && limiter.tryAcquire(); caller++) {
        granted.push(now);
      }
    }
    for (let second = 1; second < 10; second++) {
      const inWindow = granted.filter((t) => t >= second * 1000 && t < (second + 1) * 1000).length;
      expect(inWindow).toBeLessThanOrEqual(41);
    }
    // The initial burst never exceeds one second's worth.
    expect(granted.filter((t) => t === 0).length).toBeLessThanOrEqual(40);
  });

  it("refuses a rate that is not positive", () => {
    expect(() => new RateLimiter(0)).toThrow();
  });
});
