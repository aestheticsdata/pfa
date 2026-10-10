import type { Rng } from "@core/random/rng";

const HOUR_MS = 60 * 60 * 1000;
/** Bots live like people: awake from 07:00, asleep from 23:00 (server time). */
const DAY_START_HOUR = 7;
const DAY_END_HOUR = 23;
/** About 2.5 visits a day, spread at random over the 16 waking hours. */
const MEAN_GAP_MS = 6.4 * HOUR_MS;

/**
 * When a bot next opens the app: an exponential gap (visits at random, no fixed rhythm a reader
 * of the data could spot), pushed to the next morning when it would land in the night.
 */
export function nextWakeAt(from: Date, rng: Rng): Date {
  const gap = -Math.log(1 - rng.next()) * MEAN_GAP_MS;
  const candidate = new Date(from.getTime() + Math.max(5 * 60 * 1000, gap));
  const hour = candidate.getHours();
  if (hour >= DAY_START_HOUR && hour < DAY_END_HOUR) {
    return candidate;
  }
  const morning = new Date(candidate);
  if (hour >= DAY_END_HOUR) {
    morning.setDate(morning.getDate() + 1);
  }
  morning.setHours(DAY_START_HOUR, 0, 0, 0);
  return new Date(morning.getTime() + rng.int(0, 90) * 60 * 1000);
}

/** How many actions a visit holds: a glance or a proper session. */
export function actionsPerWake(rng: Rng): number {
  return rng.int(1, 5);
}

/** Pause between two actions of the same visit, like someone reading the screen. */
export function thinkTimeMs(rng: Rng): number {
  return rng.int(3, 30) * 1000;
}
