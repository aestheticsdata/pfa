import { IsNotEmpty, IsString } from "class-validator";

export class RecurringsDrawnQueryDto {
  @IsString()
  @IsNotEmpty()
  year: string;

  // Through-month index (0 = January … 11 = December), inclusive. Resolved from
  // the client's "today" (timezone-safe) so the year-to-date bound is the user's
  // current month, not the server's.
  @IsString()
  @IsNotEmpty()
  month: string;
}
