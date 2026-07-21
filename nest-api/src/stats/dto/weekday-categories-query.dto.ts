import { IsNotEmpty, IsString } from "class-validator";

export class WeekdayCategoriesQueryDto {
  @IsString()
  @IsNotEmpty()
  year: string;
}
