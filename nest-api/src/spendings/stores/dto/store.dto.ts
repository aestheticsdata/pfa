import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { FIELD_LIMITS } from "@config/field-limits";

/** A store as the user confirmed it: name and address (PFA-218, PFA-219). */
export class StoreDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.storeName)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.storeAddress)
  address: string | null;
}
