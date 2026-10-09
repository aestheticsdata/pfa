import { ArrayMinSize, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { FIELD_LIMITS } from "@config/field-limits";

/** An existing spending joining the new group, with its detail in the group. */
export class MergeSpendingGroupLineDto {
  @IsString()
  @IsNotEmpty()
  spendingID: string;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.groupDetail)
  detail?: string;
}

/**
 * "Group N spendings" (PFA-189): existing spendings of one day — lines of
 * groups included — become the lines of a new group.
 */
export class MergeSpendingGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.groupLabel)
  label: string;

  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => MergeSpendingGroupLineDto)
  lines: MergeSpendingGroupLineDto[];
}
