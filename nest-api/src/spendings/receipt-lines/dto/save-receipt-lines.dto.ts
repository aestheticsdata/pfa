import { ReceiptLineDto } from "@spendings/receipt-lines/dto/receipt-line.dto";
import { StoreDto } from "@spendings/stores/dto/store.dto";
import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsOptional, ValidateNested } from "class-validator";

// Far above any till receipt; bounds the write a single request can ask for.
const MAX_LINES = 300;

/** The whole set of a spending's lines: it replaces the previous one. Empty clears it. */
export class SaveReceiptLinesDto {
  @IsArray()
  @ArrayMaxSize(MAX_LINES)
  @ValidateNested({ each: true })
  @Type(() => ReceiptLineDto)
  lines: ReceiptLineDto[];

  /** The store (PFA-218, PFA-219): null clears it, absent leaves it as it is. */
  @IsOptional()
  @ValidateNested()
  @Type(() => StoreDto)
  store?: StoreDto | null;
}
