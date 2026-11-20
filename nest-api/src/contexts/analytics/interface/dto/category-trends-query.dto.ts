import { Matches } from "class-validator";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Two inclusive calendar-date windows (yyyy-MM-dd) for the per-category trend
 * aggregate: the current period (`from`/`to`) and the one it is compared against
 * (`prevFrom`/`prevTo`). The front owns the period math — monthly for the
 * dashboard (COS-41), weekly for Dépenses (COS-35) — and always passes both.
 */
export class CategoryTrendsQueryDto {
  @Matches(YMD, { message: "from must be a yyyy-MM-dd date" })
  from: string;

  @Matches(YMD, { message: "to must be a yyyy-MM-dd date" })
  to: string;

  @Matches(YMD, { message: "prevFrom must be a yyyy-MM-dd date" })
  prevFrom: string;

  @Matches(YMD, { message: "prevTo must be a yyyy-MM-dd date" })
  prevTo: string;
}
