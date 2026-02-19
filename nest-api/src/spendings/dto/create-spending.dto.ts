import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CreateSpendingCategoryDto } from "./create-spending-category.dto";

export class CreateSpendingDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSpendingCategoryDto)
  category?: CreateSpendingCategoryDto;

  @IsString()
  currency: string;
}
