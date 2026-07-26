import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { FIELD_LIMITS } from "@config/field-limits";

export class UpdateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.categoryName)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.color)
  color: string;
}
