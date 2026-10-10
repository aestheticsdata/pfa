/** Display helpers. The UI is in English (handoff), numbers in en-US (`12,002`). */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** `17:56:20`, in the browser's zone. */
export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** `12/10 17:56`: the date and minute of an older event. */
export function dayTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** `now`, `12s ago`, `3m ago`, `5h ago`, `2d ago`; `—` for never. */
export function ago(iso: string | null, now: number): string {
  if (!iso) return "—";
  const elapsed = Math.max(0, now - new Date(iso).getTime());
  if (elapsed < 5 * SECOND) return "now";
  if (elapsed < MINUTE) return `${Math.round(elapsed / SECOND)}s ago`;
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
  return `${Math.floor(elapsed / DAY)}d ago`;
}

/** A session's age: `42s`, `17m`, `5h 03m`, `9d`. */
export function duration(ms: number): string {
  const seconds = Math.floor(ms / SECOND);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400)
    return `${Math.floor(seconds / 3600)}h ${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}m`;
  return `${Math.floor(seconds / 86400)}d`;
}

/** `2m 05s`, `45s`: a short countdown. */
export function countdown(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return s >= 60 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`;
}

/** MB with one decimal below 100, none above (`38.2`, `213`). */
export function megabytes(value: number): string {
  return value >= 100 ? value.toFixed(0) : value.toFixed(1);
}

export function count(value: number): string {
  return value.toLocaleString("en-US");
}

/** "empty in ~X" at the current pace. */
export function longSpan(days: number): string {
  if (days < 1) return `${Math.max(1, Math.round(days * 24))} h`;
  return `${Math.round(days)} days`;
}
