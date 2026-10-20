import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { MAX_AMOUNT } from "@config/amount-limits";
import { FIELD_LIMITS } from "@config/field-limits";
import { CreateSpendingCategoryDto } from "@spendings/dto/create-spending-category.dto";

export class UpdateRecurringDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.label)
  label: string;

  @IsNumber()
  @Min(-MAX_AMOUNT)
  @Max(MAX_AMOUNT)
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSpendingCategoryDto)
  category?: CreateSpendingCategoryDto;
}
