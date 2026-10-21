import { FIELD_LIMITS } from "@config/field-limits";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

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
