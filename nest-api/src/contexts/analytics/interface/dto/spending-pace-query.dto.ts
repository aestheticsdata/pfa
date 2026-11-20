import { Matches } from "class-validator";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The reference month whose spending pace is compared to the preceding months
 * (GET /spending-pace): any day of the target month as a yyyy-MM-dd date. The
 * front passes the 1st of the displayed dashboard month; the service derives the
 * three months before it from this date (UTC), so any in-month day works too.
 */
export class SpendingPaceQueryDto {
  @Matches(YMD, { message: "start must be a yyyy-MM-dd date" })
  start: string;
}
