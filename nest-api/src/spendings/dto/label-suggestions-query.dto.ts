import { IsOptional, IsString } from "class-validator";

export class LabelSuggestionsQueryDto {
  // The typed prefix. Optional/empty returns the user's most frequently used
  // labels (shown when the field is empty). A string param, so it needs no
  // numeric transform (the global ValidationPipe has none).
  @IsOptional()
  @IsString()
  q?: string;
}
