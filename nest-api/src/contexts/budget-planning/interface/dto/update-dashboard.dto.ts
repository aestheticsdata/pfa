import { MAX_AMOUNT } from "@config/amount-limits";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, Max, Min } from "class-validator";

export class UpdateDashboardDto {
  @IsOptional()
  @IsNumber()
  @Min(-MAX_AMOUNT)
  @Max(MAX_AMOUNT)
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(-MAX_AMOUNT)
  @Max(MAX_AMOUNT)
  @Type(() => Number)
  ceiling?: number;
}
