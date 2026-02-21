import { IsNotEmpty, IsObject, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class CopyRecurringsDatesDto {
  @IsString()
  @IsNotEmpty()
  start: string;

  @IsString()
  @IsNotEmpty()
  end: string;

  @IsString()
  @IsNotEmpty()
  previousMonthStart: string;
}

export class CopyRecurringsDto {
  @IsObject()
  @ValidateNested()
  @Type(() => CopyRecurringsDatesDto)
  dates: CopyRecurringsDatesDto;
}
