import { IsString } from "class-validator";

export class SpendingsQueryDto {
  @IsString()
  from: string;

  @IsString()
  to: string;
}
