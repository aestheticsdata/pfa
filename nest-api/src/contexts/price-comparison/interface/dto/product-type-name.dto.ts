import { FIELD_LIMITS } from "@config/field-limits";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

/** A product type's new name (PFA-224). */
export class ProductTypeNameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.productTypeName)
  name: string;
}
