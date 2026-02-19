import { IsOptional, IsString } from "class-validator";

export class CreateSpendingCategoryDto {
  @IsOptional()
  @IsString()
  ID?: string | null;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string | null;
}
