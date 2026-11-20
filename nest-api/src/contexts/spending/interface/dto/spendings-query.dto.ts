import { Matches } from "class-validator";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The displayed month as yyyy-MM-dd bounds (GET /spendings), inclusive (PFA-239). The front used to
 * interpolate a Date, which only parsed because the query parser turned "GMT+0200" into
 * "GMT 0200", read as UTC.
 */
export class SpendingsQueryDto {
  @Matches(YMD, { message: "from must be a yyyy-MM-dd date" })
  from: string;

  @Matches(YMD, { message: "to must be a yyyy-MM-dd date" })
  to: string;
}
