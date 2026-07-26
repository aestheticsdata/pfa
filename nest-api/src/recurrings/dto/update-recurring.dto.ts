import { IsNotEmpty, IsNumber, IsString, MaxLength } from "class-validator";
import { Type } from "class-transformer";
import { FIELD_LIMITS } from "@config/field-limits";

export class UpdateRecurringDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.label)
  label: string;

  @IsNumber()
  @Type(() => Number)
  amount: number;
}
