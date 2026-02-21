import { IsNotEmpty, IsString } from "class-validator";

export class DashboardQueryDto {
  @IsString()
  @IsNotEmpty()
  start: string;
}
