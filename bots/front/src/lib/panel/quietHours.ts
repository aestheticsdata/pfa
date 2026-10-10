import type { QuietWindow } from "@lib/panel/interfaces/quietTypes";

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY_MINUTES = 1440;

export const isClock = (value: string): boolean => CLOCK.test(value);

export const toMinutes = (value: string): number => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));

const toClock = (minutes: number): string => {
  const wrapped = ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
};

/** Digits only, the colon added as you type: `2230` → `22:30`. */
export function maskClock(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

/** The app zone's offset from UTC right now, in minutes (+120 for Paris in summer). */
export function zoneOffsetMinutes(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const local = read("hour") * 60 + read("minute");
  const utc = at.getUTCHours() * 60 + at.getUTCMinutes();
  const diff = (local - utc + DAY_MINUTES) % DAY_MINUTES;
  return diff > DAY_MINUTES / 2 ? diff - DAY_MINUTES : diff;
}

/** `CEST` in summer, `CET` in winter. */
export function zoneAbbreviation(timeZone: string, at: Date): string {
  return (
    new Intl.DateTimeFormat("en-GB", { timeZone, timeZoneName: "short" })
      .formatToParts(at)
      .find((part) => part.type === "timeZoneName")?.value ?? timeZone
  );
}

/** Shifts a window by `minutes` (app → UTC: minus the offset). An incomplete end stays as typed. */
export function shiftWindow(window: QuietWindow, minutes: number): QuietWindow {
  const shift = (value: string) => (isClock(value) ? toClock(toMinutes(value) + minutes) : value);
  return { from: shift(window.from), to: shift(window.to) };
}

/** `+2 h` / `−1 h`. */
export function offsetLabel(minutes: number): string {
  return `${minutes >= 0 ? "+" : "−"}${Math.abs(minutes / 60)} h`;
}

/** The handoff's two errors; null when the window can be applied (or isn't complete yet). */
export const QUIET_ERROR = {
  same: "same",
  badClock: "badClock",
} as const;

export function quietError(window: QuietWindow): (typeof QUIET_ERROR)[keyof typeof QUIET_ERROR] | null {
  if (isClock(window.from) && isClock(window.to) && window.from === window.to) return QUIET_ERROR.same;
  const badFull = (value: string) => value.length === 5 && !isClock(value);
  if (badFull(window.from) || badFull(window.to)) return QUIET_ERROR.badClock;
  return null;
}

export const isApplicable = (window: QuietWindow): boolean =>
  isClock(window.from) && isClock(window.to) && window.from !== window.to;

export const crossesMidnight = (window: QuietWindow): boolean =>
  isClock(window.from) && isClock(window.to) && toMinutes(window.to) < toMinutes(window.from);
