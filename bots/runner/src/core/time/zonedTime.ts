/**
 * The time of day in an app's own time zone. ks-b runs on UTC while the bots live on Paris time,
 * and the gap moves twice a year (UTC+2 in summer, UTC+1 in winter): reading the clock through
 * `Intl` keeps every daily window right across the change, where a fixed UTC offset would not.
 */
export function zonedHour(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour + minute / 60;
}

/** The calendar day (`YYYY-MM-DD`) in the app's time zone, not the server's. */
export function zonedDay(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
