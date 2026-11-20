import { AUTO_LOCK_DELAY, shouldLockOnReturn } from "@auth/lockTimer";

const NOW = 1_800_000_000_000;

describe("shouldLockOnReturn", () => {
  it("never locks an app that did not go to the background", () => {
    expect(shouldLockOnReturn(null, NOW, AUTO_LOCK_DELAY.immediate)).toBe(false);
  });

  it("stays unlocked within the delay, locks from the delay on", () => {
    expect(shouldLockOnReturn(NOW - 59_000, NOW, AUTO_LOCK_DELAY.oneMinute)).toBe(false);
    expect(shouldLockOnReturn(NOW - 60_000, NOW, AUTO_LOCK_DELAY.oneMinute)).toBe(true);
    expect(shouldLockOnReturn(NOW - 4 * 60_000, NOW, AUTO_LOCK_DELAY.fiveMinutes)).toBe(false);
  });

  it("locks on every return when set to immediate", () => {
    expect(shouldLockOnReturn(NOW, NOW, AUTO_LOCK_DELAY.immediate)).toBe(true);
  });

  it("locks when the clock went backwards, to be safe", () => {
    expect(shouldLockOnReturn(NOW + 10_000, NOW, AUTO_LOCK_DELAY.fiveMinutes)).toBe(true);
  });
});
