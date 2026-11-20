import { MAX_AMOUNT } from "@config/amount-limits";
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString, Max, Min } from "class-validator";

export class CreateDashboardDto {
  @IsString()
  @IsNotEmpty()
  start: string;

  @IsString()
  @IsNotEmpty()
  end: string;

  @IsNumber()
  @Min(-MAX_AMOUNT)
  @Max(MAX_AMOUNT)
  @Type(() => Number)
  amount: number;
}
