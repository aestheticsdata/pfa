import { IsNotEmpty, IsString } from "class-validator";

export class WeeklyStatsQueryDto {
  @IsString()
  @IsNotEmpty()
  start: string;
}
