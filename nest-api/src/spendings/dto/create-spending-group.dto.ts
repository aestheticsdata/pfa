import { ArrayMinSize, IsNotEmpty, IsString, MaxLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { FIELD_LIMITS } from "@config/field-limits";
import { SpendingGroupLineDto } from "@spendings/dto/spending-group-line.dto";

export class CreateSpendingGroupDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.groupLabel)
  label: string;

  @IsString()
  @MaxLength(FIELD_LIMITS.currency)
  currency: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SpendingGroupLineDto)
  lines: SpendingGroupLineDto[];
}
