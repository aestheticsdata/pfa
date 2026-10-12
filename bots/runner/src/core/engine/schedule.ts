import { zonedHour } from "@core/time/zonedTime";

import type { Rng } from "@core/random/rng";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
/** Bots live like people: awake from 07:00, asleep from 23:00 — on the app's clock, not ks-b's UTC. */
const DAY_START_HOUR = 7;
const DAY_END_HOUR = 23;
/** About 2.5 visits a day, spread at random over the 16 waking hours. */
const MEAN_GAP_MS = 6.4 * HOUR_MS;

/**
 * When a bot next opens the app: an exponential gap (visits at random, no fixed rhythm a reader
 * of the data could spot) counted in waking time only — the clock stops at 23:00 and runs again at
 * 07:00. A gap that would end in the night carries over into the next day instead of being pushed
 * to 07:00, so the bots do not all wake together (PFA-228): the morning is as random as the afternoon.
 */
export function nextWakeAt(from: Date, rng: Rng, timeZone: string): Date {
  let left = Math.max(5 * MINUTE_MS, -Math.log(1 - rng.next()) * MEAN_GAP_MS);
  let at = isAwake(from, timeZone) ? from.getTime() : nextMorning(from, timeZone);
  for (;;) {
    // No clock change between 07:00 and 23:00: the hours left in the day are plain arithmetic.
    // The clock reads whole minutes: the seconds past the minute come off too.
    const awake = (DAY_END_HOUR - zonedHour(new Date(at), timeZone)) * HOUR_MS - (at % MINUTE_MS);
    if (left < awake) {
      return new Date(at + left);
    }
    left -= awake;
    at = nextMorning(new Date(at + awake), timeZone);
  }
}

function isAwake(date: Date, timeZone: string): boolean {
  const hour = zonedHour(date, timeZone);
  return hour >= DAY_START_HOUR && hour < DAY_END_HOUR;
}

/** The next 07:00 on the app's clock, from a time in the night. */
function nextMorning(night: Date, timeZone: string): number {
  const hour = zonedHour(night, timeZone);
  let morning = night.getTime() + ((DAY_START_HOUR - hour + 24) % 24) * HOUR_MS;
  // On the night the clocks change, that lands an hour off 07:00: read the clock again and correct.
  morning += (DAY_START_HOUR - zonedHour(new Date(morning), timeZone)) * HOUR_MS;
  return morning;
}

/** How many actions a visit holds: a glance or a proper session. */
export function actionsPerWake(rng: Rng): number {
  return rng.int(1, 5);
}

/** Pause between two actions of the same visit, like someone reading the screen. */
export function thinkTimeMs(rng: Rng): number {
  return rng.int(3, 30) * 1000;
}

/** Burst pace (PFA-128): a visit every 1 to 5 minutes, day and night — a stress test, not a life. */
export function burstWakeAt(from: Date, rng: Rng): Date {
  return new Date(from.getTime() + rng.int(60, 300) * 1000);
}

/** Burst pace: 1 to 5 seconds between two actions. */
export function burstThinkTimeMs(rng: Rng): number {
  return rng.int(1, 5) * 1000;
}

/**
 * A load bot's first visit after the ramp brings it up: soon, so a ramp shows on the charts, and
 * spread out, so a step of fifty does not sign in fifty accounts in the same second.
 */
export function firstVisitDelayMs(rng: Rng, burst: boolean): number {
  return rng.int(5, burst ? 60 : 900) * 1000;
}
