import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class AddUserDto {
  @IsString()
  @MinLength(1, { message: "Name is required" })
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1, { message: "Password is required" })
  password: string;

  @IsOptional()
  @IsString()
  baseCurrency?: string;

  @IsOptional()
  registerDate?: Date | string;

  @IsOptional()
  @IsString()
  language?: string;
}
