import { IsNotEmpty, IsString } from "class-validator";

export class DailyStatsQueryDto {
  @IsString()
  @IsNotEmpty()
  year: string;
}
