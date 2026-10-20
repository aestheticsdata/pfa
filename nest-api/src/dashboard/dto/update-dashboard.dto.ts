import { IsNumber, IsOptional, Max, Min } from "class-validator";
import { Type } from "class-transformer";
import { MAX_AMOUNT } from "@config/amount-limits";

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
