import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";
import { Type } from "class-transformer";
import { FIELD_LIMITS } from "@config/field-limits";

export class CreateExceptionalDto {
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
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.currency)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.exceptionalCategoryName)
  categoryName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.color)
  categoryColor?: string;
}
