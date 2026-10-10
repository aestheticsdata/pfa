import type { RunnerQuietHours, RunnerQuietHoursInput } from "#app/runner/interfaces/runnerApiTypes.js";

const MINUTE_MS = 60_000;

/** Minutes since midnight on the app's clock (ks-b is UTC; the apps are not). */
function zonedMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return read("hour") * 60 + read("minute");
}

const clock = (value: string): number => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));

/** The runner's rule, for the simulated runner of mock mode: may cross midnight. */
export function isQuiet(date: Date, hours: RunnerQuietHoursInput, timeZone: string): boolean {
  const from = clock(hours.from);
  const to = clock(hours.to);
  const now = zonedMinutes(date, timeZone);
  return from < to ? now >= from && now < to : now >= from || now < to;
}

/** The quiet window as the runner reports it, computed for "now". */
export function quietSnapshot(hours: RunnerQuietHoursInput, timeZone: string): RunnerQuietHours {
  const now = new Date();
  const active = isQuiet(now, hours, timeZone);
  const start = Math.ceil(now.getTime() / MINUTE_MS) * MINUTE_MS;
  let next = start;
  for (let at = start; at <= start + 25 * 60 * MINUTE_MS; at += MINUTE_MS) {
    if (isQuiet(new Date(at), hours, timeZone) !== active) {
      next = at;
      break;
    }
  }
  return { ...hours, tz: timeZone, active, nextChangeAt: new Date(next).toISOString() };
}
