import { IsNotEmpty, IsString } from "class-validator";

export class MonthlyIncomeQueryDto {
  @IsString()
  @IsNotEmpty()
  year: string;
}
