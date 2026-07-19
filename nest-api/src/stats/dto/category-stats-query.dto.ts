import { IsOptional, Matches } from "class-validator";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Optional date window for the per-category usage aggregate. Both bounds are
 * inclusive calendar dates (yyyy-MM-dd); omit both for the all-time aggregate
 * (Categories page). The spending-modal quick-picks pass the current year to
 * date so "Fréquentes" reflects recent usage (COS-137).
 */
export class CategoryStatsQueryDto {
  @IsOptional()
  @Matches(YMD, { message: "from must be a yyyy-MM-dd date" })
  from?: string;

  @IsOptional()
  @Matches(YMD, { message: "to must be a yyyy-MM-dd date" })
  to?: string;
}
