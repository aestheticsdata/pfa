import { IsOptional, IsString } from "class-validator";

export class ExceptionalsQueryDto {
  @IsOptional()
  @IsString()
  year?: string;
}
