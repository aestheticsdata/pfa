import { IsOptional, IsString } from "class-validator";

export class SpendingsSearchQueryDto {
  @IsString()
  q: string;

  // Keyset cursor = the ID of the last row of the previous page. A string param,
  // so it needs no numeric transform (the global ValidationPipe has none).
  @IsOptional()
  @IsString()
  cursor?: string;

  // Optional year filter (as a string; parsed and validated in the service).
  @IsOptional()
  @IsString()
  year?: string;
}
