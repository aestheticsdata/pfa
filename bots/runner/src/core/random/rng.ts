/**
 * Seeded PRNG (mulberry32): a bot seeded with its id makes the same "personal" choices on every
 * restart (its upload pace, its habits), and tests replay exactly.
 */
export class Rng {
  private state: number;

  constructor(seed: number | string) {
    // Mixed, so that close seeds (`pfa:ceres`, `pfa:janus`) don't start on close values.
    this.state = mix(typeof seed === "number" ? seed >>> 0 : hashSeed(seed));
  }

  /** Uniform in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max], both included. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Float in [min, max). */
  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error("Rng.pick on an empty list");
    }
    return items[Math.floor(this.next() * items.length)] as T;
  }

  /** Weighted choice; items with a weight of 0 or less are never picked. */
  weighted<T>(items: readonly T[], weightOf: (item: T) => number): T | undefined {
    const total = items.reduce((sum, item) => sum + Math.max(0, weightOf(item)), 0);
    if (total <= 0) {
      return undefined;
    }
    let roll = this.next() * total;
    for (const item of items) {
      roll -= Math.max(0, weightOf(item));
      if (roll < 0) {
        return item;
      }
    }
    return items[items.length - 1];
  }
}

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/** murmur3's finalizer: every input bit flips about half the output bits. */
function mix(value: number): number {
  let h = value;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}
