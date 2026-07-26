import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { FIELD_LIMITS } from "@config/field-limits";

export class AddUserDto {
  @IsString()
  @MinLength(1, { message: "Name is required" })
  @MaxLength(FIELD_LIMITS.userName)
  name: string;

  @IsEmail()
  @MaxLength(FIELD_LIMITS.email)
  email: string;

  @IsString()
  @MinLength(1, { message: "Password is required" })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.currency)
  baseCurrency?: string;

  @IsOptional()
  registerDate?: Date | string;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.language)
  language?: string;
}
