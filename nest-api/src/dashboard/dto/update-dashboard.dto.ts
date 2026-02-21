import { IsNumber, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class UpdateDashboardDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ceiling?: number;
}
