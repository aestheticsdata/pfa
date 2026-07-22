import { IsIn, IsOptional, IsString } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsIn(["fr", "en"])
  language?: string;
}
