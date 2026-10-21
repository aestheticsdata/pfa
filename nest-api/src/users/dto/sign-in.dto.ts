import { FIELD_LIMITS } from "@config/field-limits";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class SignInDto {
  @IsEmail()
  @MaxLength(FIELD_LIMITS.email)
  email: string;

  @IsString()
  @MinLength(3, { message: "Password must be at least 3 characters long" })
  password: string;
}
