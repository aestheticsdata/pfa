import { IsEmail, IsString, MinLength } from "class-validator";

export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3, { message: "Password must be at least 3 characters long" })
  password: string;
}
