import { IsOptional, IsString, MaxLength } from "class-validator";
import { FIELD_LIMITS } from "@config/field-limits";

export class CreateSpendingCategoryDto {
  @IsOptional()
  @IsString()
  ID?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.categoryName)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.color)
  color?: string | null;
}
