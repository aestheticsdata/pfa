import { IsNotEmpty, IsString } from "class-validator";

export class RegularMonthlyAverageQueryDto {
  @IsString()
  @IsNotEmpty()
  year: string;
}
