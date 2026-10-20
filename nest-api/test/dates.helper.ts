import { format } from "date-fns";

/**
 * The 1st of `date`'s month as yyyy-MM-dd, on the local calendar (PFA-258). The copies this
 * replaces went through `toISOString()`, which shifts a local midnight to the previous day in any
 * timezone east of UTC — the end of the previous month in Paris.
 */
export function firstDayOfMonth(date: Date): string {
  return format(new Date(date.getFullYear(), date.getMonth(), 1), "yyyy-MM-dd");
}
