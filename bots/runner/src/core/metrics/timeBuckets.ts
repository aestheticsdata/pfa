import type { TimeBucketsOptions } from "@core/interfaces/metricsTypes";

/**
 * A rolling window of fixed time slices: writes go to the slice "now" falls in, and slices older
 * than the window fall off. Slices nobody wrote to are still there, empty — a quiet minute charts
 * as zeros, not as a gap.
 */
export class TimeBuckets<T> {
  private readonly buckets: T[];
  /** Index of the slice `0` of the window, i.e. `floor(time / bucketMs)` of the newest one. */
  private newest: number;

  constructor(private readonly options: TimeBucketsOptions<T>) {
    this.buckets = Array.from({ length: options.size }, () => options.make());
    this.newest = this.slot(this.now());
  }

  /** The slice "now" falls in, rolling the window forward first. */
  current(): T {
    this.roll();
    return this.buckets[this.newest % this.options.size] as T;
  }

  /** Every slice of the window, oldest first, with the time each one starts. */
  read(): { at: number; bucket: T }[] {
    this.roll();
    const { size, bucketMs } = this.options;
    return Array.from({ length: size }, (_, i) => {
      const slot = this.newest - size + 1 + i;
      return { at: slot * bucketMs, bucket: this.buckets[((slot % size) + size) % size] as T };
    });
  }

  private roll(): void {
    const target = this.slot(this.now());
    const steps = Math.min(target - this.newest, this.options.size);
    for (let i = 1; i <= steps; i++) {
      this.buckets[(target - steps + i) % this.options.size] = this.options.make();
    }
    this.newest = Math.max(this.newest, target);
  }

  private slot(time: number): number {
    return Math.floor(time / this.options.bucketMs);
  }

  private now(): number {
    return (this.options.clock ?? Date.now)();
  }
}

/** The value below which `q` (0–1) of the samples fall; 0 for no sample. */
export function percentile(samples: number[], q: number): number {
  if (samples.length === 0) {
    return 0;
  }
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
}
