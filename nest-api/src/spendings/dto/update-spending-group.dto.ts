import { ArrayMinSize, IsNotEmpty, IsString, MaxLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { FIELD_LIMITS } from "@config/field-limits";
import { SpendingGroupLineDto } from "@spendings/dto/spending-group-line.dto";

/** The group's whole new state: lines missing from `lines` are deleted. */
export class UpdateSpendingGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.groupLabel)
  label: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SpendingGroupLineDto)
  lines: SpendingGroupLineDto[];
}
