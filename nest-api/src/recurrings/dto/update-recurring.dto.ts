import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Type } from "class-transformer";

export class UpdateRecurringDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsNumber()
  @Type(() => Number)
  amount: number;
}
