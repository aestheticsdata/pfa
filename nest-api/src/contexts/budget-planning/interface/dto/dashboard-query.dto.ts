import { Matches } from "class-validator";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/**
 * First day of the displayed month as a yyyy-MM-dd date (GET /dashboard, /dashboard/projection — PFA-239). The front used to
 * interpolate a Date, which only parsed because the query parser turned "GMT+0200" into
 * "GMT 0200", read as UTC.
 */
export class DashboardQueryDto {
  @Matches(YMD, { message: "start must be a yyyy-MM-dd date" })
  start: string;
}
