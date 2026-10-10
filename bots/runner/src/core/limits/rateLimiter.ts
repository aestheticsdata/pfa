import type { Clock } from "@core/interfaces/limitTypes";

/**
 * Global token bucket: never more than `ratePerSecond` requests per second across every bot, so a
 * bug in an action or a burst of wake-ups can't turn the runner into a denial of service. Callers
 * queue in order; the bucket holds at most one second of burst.
 */
export class RateLimiter {
  private tokens: number;
  private last: number;
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly ratePerSecond: number,
    private readonly clock: Clock = Date.now,
  ) {
    if (!(ratePerSecond > 0)) {
      throw new Error("RateLimiter needs a positive rate");
    }
    this.tokens = ratePerSecond;
    this.last = clock();
  }

  /** Resolves when the caller may send one request. */
  acquire(): Promise<void> {
    const turn = this.queue.then(() => this.waitForToken());
    this.queue = turn;
    return turn;
  }

  /** Synchronous variant for simulations: takes a token if one is there. */
  tryAcquire(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  private async waitForToken(): Promise<void> {
    for (;;) {
      if (this.tryAcquire()) {
        return;
      }
      const waitMs = Math.ceil(((1 - this.tokens) / this.ratePerSecond) * 1000);
      await new Promise((resolve) => setTimeout(resolve, Math.max(1, waitMs)));
    }
  }

  private refill(): void {
    const now = this.clock();
    const elapsed = Math.max(0, now - this.last) / 1000;
    this.last = now;
    this.tokens = Math.min(this.ratePerSecond, this.tokens + elapsed * this.ratePerSecond);
  }
}
