import { IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min } from "class-validator";
import { Type } from "class-transformer";
import { FIELD_LIMITS } from "@config/field-limits";

// `ReceiptLines.amount` is a Decimal(6, 2); a discount line is negative.
const MAX_LINE_AMOUNT = 9999.99;

/** One receipt line as the user accepted it (PFA-214). */
export class ReceiptLineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.receiptLineLabel)
  label: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(-MAX_LINE_AMOUNT)
  @Max(MAX_LINE_AMOUNT)
  @Type(() => Number)
  amount: number;
}
