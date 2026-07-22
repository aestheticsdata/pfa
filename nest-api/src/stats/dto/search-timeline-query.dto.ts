import { IsIn, IsString, Matches } from "class-validator";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Query for the statistics search-timeline aggregate (COS-160): a text term,
 * an inclusive calendar-day window and the bucket granularity. The minimum
 * term length is enforced in the service (shared with /spendings/search).
 */
export class SearchTimelineQueryDto {
  @IsString()
  q: string;

  @Matches(YMD, { message: "from must be a yyyy-MM-dd date" })
  from: string;

  @Matches(YMD, { message: "to must be a yyyy-MM-dd date" })
  to: string;

  @IsIn(["day", "week"])
  bucket: "day" | "week";
}
