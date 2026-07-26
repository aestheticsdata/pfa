import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";
import { Type } from "class-transformer";
import { FIELD_LIMITS } from "@config/field-limits";

export class CreateRecurringDto {
  @IsString()
  @IsNotEmpty()
  start: string;

  @IsString()
  @IsNotEmpty()
  end: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.label)
  label: string;

  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.currency)
  currency?: string;
}
