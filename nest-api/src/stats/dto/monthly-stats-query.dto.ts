import { IsNotEmpty, IsString } from "class-validator";

export class MonthlyStatsQueryDto {
  @IsString()
  @IsNotEmpty()
  from: string;
}
