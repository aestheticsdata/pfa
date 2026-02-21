import { IsNotEmpty, IsString } from "class-validator";

export class StatisticsQueryDto {
  @IsString()
  @IsNotEmpty()
  categories: string;

  @IsString()
  @IsNotEmpty()
  years: string;
}
