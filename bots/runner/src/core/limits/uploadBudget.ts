import type { Clock, UploadBudgetOptions, UploadBudgetSnapshot, UploadEntry } from "@core/interfaces/limitTypes";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Hard cap on what the bots upload, across every bot, over a rolling window (400 MB / 365 days for
 * PFA-124). A ledger of every upload: an upload happens only after `reserve` has written it down,
 * so the total can never cross the budget — whatever the bots, their pace, or a restart. A failed
 * upload keeps its reservation: wasting a few KB of budget is the safe side of the trade.
 */
export class UploadBudget {
  private entries: UploadEntry[];
  /** Index of the oldest entry still inside the window; older ones are compacted away lazily. */
  private head = 0;
  private total: number;

  constructor(
    private readonly options: UploadBudgetOptions,
    private readonly clock: Clock = Date.now,
  ) {
    this.entries = [...options.entries].sort((a, b) => a.at - b.at);
    this.total = this.entries.reduce((sum, entry) => sum + entry.bytes, 0);
  }

  usedBytes(): number {
    this.expire();
    return this.total;
  }

  canSpend(bytes: number): boolean {
    return bytes > 0 && this.usedBytes() + bytes <= this.options.budgetBytes;
  }

  /** Records the upload if it fits; returns false — and records nothing — if it doesn't. */
  reserve(bytes: number): boolean {
    if (!this.canSpend(bytes)) {
      return false;
    }
    this.entries.push({ at: this.clock(), bytes });
    this.total += bytes;
    this.options.onChange?.(this.live());
    return true;
  }

  snapshot(): UploadBudgetSnapshot {
    const usedBytes = this.usedBytes();
    const weekStart = this.clock() - WEEK_MS;
    const week = this.live().filter((entry) => entry.at > weekStart);
    return {
      budgetBytes: this.options.budgetBytes,
      usedBytes,
      remainingBytes: Math.max(0, this.options.budgetBytes - usedBytes),
      uploadsThisWeek: week.length,
      bytesThisWeek: week.reduce((sum, entry) => sum + entry.bytes, 0),
    };
  }

  private live(): UploadEntry[] {
    return this.entries.slice(this.head);
  }

  private expire(): void {
    const cutoff = this.clock() - this.options.windowMs;
    const before = this.head;
    while (this.head < this.entries.length && (this.entries[this.head]?.at ?? Infinity) <= cutoff) {
      this.total -= this.entries[this.head]?.bytes ?? 0;
      this.head += 1;
    }
    const expired = this.head !== before;
    if (this.head > 1024 && this.head > this.entries.length / 2) {
      this.entries = this.live();
      this.head = 0;
    }
    if (expired) {
      this.options.onChange?.(this.live());
    }
  }
}
