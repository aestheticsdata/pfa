import { ArrayMaxSize, IsArray, ValidateNested } from "class-validator";
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
}
