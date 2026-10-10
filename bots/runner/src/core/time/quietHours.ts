import { zonedHour } from "@core/time/zonedTime";

import type { QuietHours } from "@core/interfaces/timeTypes";

const CLOCK = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MINUTE_MS = 60_000;

/** `"22:00"` → hours as a number (22). `null` for anything that is not a 24 h `HH:MM`. */
export function parseClock(value: unknown): number | null {
  const match = typeof value === "string" ? CLOCK.exec(value) : null;
  return match ? Number(match[1]) + Number(match[2]) / 60 : null;
}

export function isValidQuietHours(value: unknown): value is QuietHours {
  const hours = value as Partial<QuietHours> | null;
  const from = parseClock(hours?.from);
  const to = parseClock(hours?.to);
  return from !== null && to !== null && from !== to;
}

/**
 * Whether `date` falls in the quiet window, read on the app's clock. The window may cross
 * midnight — the default 22:00 → 10:00 does: quiet from 22:00 until 10:00 the next morning.
 */
export function isQuietTime(date: Date, hours: QuietHours, timeZone: string): boolean {
  const from = parseClock(hours.from) ?? 0;
  const to = parseClock(hours.to) ?? 0;
  const now = zonedHour(date, timeZone);
  return from < to ? now >= from && now < to : now >= from || now < to;
}

/**
 * The next instant the window opens or closes. Walked minute by minute (at most a day), which is
 * cheap and stays right on the nights the clocks change, where offset arithmetic would not.
 */
export function nextQuietChange(date: Date, hours: QuietHours, timeZone: string): Date {
  const start = Math.ceil(date.getTime() / MINUTE_MS) * MINUTE_MS;
  const now = isQuietTime(date, hours, timeZone);
  for (let at = start; at <= start + 25 * 60 * MINUTE_MS; at += MINUTE_MS) {
    if (isQuietTime(new Date(at), hours, timeZone) !== now) {
      return new Date(at);
    }
  }
  return new Date(start);
}
