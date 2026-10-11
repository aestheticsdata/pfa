import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import { FIELD_LIMITS } from "@config/field-limits";
import { Type } from "class-transformer";
import { ReceiptLineDto } from "@spendings/receipt-lines/dto/receipt-line.dto";

// Far above any till receipt; bounds the write a single request can ask for.
const MAX_LINES = 300;

/** The whole set of a spending's lines: it replaces the previous one. Empty clears it. */
export class SaveReceiptLinesDto {
  @IsArray()
  @ArrayMaxSize(MAX_LINES)
  @ValidateNested({ each: true })
  @Type(() => ReceiptLineDto)
  lines: ReceiptLineDto[];

  /** The store's name (PFA-218): null clears it, absent leaves it as it is. */
  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.storeName)
  store?: string | null;
}
