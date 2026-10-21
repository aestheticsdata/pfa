import { MAX_AMOUNT } from "@config/amount-limits";
import { FIELD_LIMITS } from "@config/field-limits";
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class UpdateExceptionalDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.label)
  label: string;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.description)
  description?: string;

  @IsNumber()
  @Min(-MAX_AMOUNT)
  @Max(MAX_AMOUNT)
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.exceptionalCategoryName)
  categoryName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.color)
  categoryColor?: string;
}
