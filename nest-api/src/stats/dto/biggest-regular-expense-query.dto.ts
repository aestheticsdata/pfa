import { IsNotEmpty, IsString } from "class-validator";

export class BiggestRegularExpenseQueryDto {
  @IsString()
  @IsNotEmpty()
  year: string;
}
