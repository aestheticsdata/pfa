import { ArrayMinSize, IsString } from "class-validator";

/** The spendings a receipt action applies to (PFA-189). */
export class SpendingIdsDto {
  @ArrayMinSize(1)
  @IsString({ each: true })
  spendingIDs: string[];
}
