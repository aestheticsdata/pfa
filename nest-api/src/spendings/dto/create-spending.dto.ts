import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { FIELD_LIMITS } from "@config/field-limits";
import { CreateSpendingCategoryDto } from "./create-spending-category.dto";

export class CreateSpendingDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.label)
  label: string;

  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSpendingCategoryDto)
  category?: CreateSpendingCategoryDto;

  @IsString()
  @MaxLength(FIELD_LIMITS.currency)
  currency: string;
}
