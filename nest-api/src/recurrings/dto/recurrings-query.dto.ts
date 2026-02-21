import { IsString } from "class-validator";

export class RecurringsQueryDto {
  @IsString()
  start: string;
}
