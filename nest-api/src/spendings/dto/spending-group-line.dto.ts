import { MAX_AMOUNT } from "@config/amount-limits";
import { FIELD_LIMITS } from "@config/field-limits";
import { CreateSpendingCategoryDto } from "@spendings/dto/create-spending-category.dto";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsPositive, IsString, Max, MaxLength, ValidateNested } from "class-validator";

/** One line of a group (PFA-189): its own category, optional detail and amount. */
export class SpendingGroupLineDto {
  /** Set when editing an existing line; absent for a line added in the modal. */
  @IsOptional()
  @IsString()
  ID?: string;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.groupDetail)
  detail?: string;

  @IsNumber()
  @IsPositive()
  @Max(MAX_AMOUNT)
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSpendingCategoryDto)
  category?: CreateSpendingCategoryDto;
}
