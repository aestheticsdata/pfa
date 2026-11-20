import { Matches } from "class-validator";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The month to scan for its busiest calendar week-range (GET /busiest-week): any
 * day of the target month as a yyyy-MM-dd date. The front passes the 1st of the
 * displayed dashboard month; the service derives the month (and its week slices)
 * from it, so any in-month day would work too.
 */
export class BusiestWeekQueryDto {
  @Matches(YMD, { message: "start must be a yyyy-MM-dd date" })
  start: string;
}
