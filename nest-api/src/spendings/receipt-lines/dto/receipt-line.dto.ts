import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { Type } from "class-transformer";
import { MAX_AMOUNT } from "@config/amount-limits";
import { FIELD_LIMITS } from "@config/field-limits";
import { SIZE_UNIT } from "@spendings/receipt-lines/size-units";
import type { SizeUnit } from "@spendings/receipt-lines/interfaces/receiptLinesTypes";

// `quantity` and `size` are Decimal(8, 3).
const MAX_MEASURE = 99999.999;
const MIN_MEASURE = 0.001;

/** One receipt line as the user accepted it (PFA-214), with what a unit price needs (PFA-219). */
export class ReceiptLineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.receiptLineLabel)
  label: string;

  // A discount line is negative.
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(-MAX_AMOUNT)
  @Max(MAX_AMOUNT)
  @Type(() => Number)
  amount: number;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(MIN_MEASURE)
  @Max(MAX_MEASURE)
  @Type(() => Number)
  quantity: number;

  /** One item's size; null when sold by the piece. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(MIN_MEASURE)
  @Max(MAX_MEASURE)
  @Type(() => Number)
  size: number | null;

  @IsOptional()
  @IsIn(Object.values(SIZE_UNIT))
  sizeUnit: SizeUnit | null;

  /** The generic product's name: an existing one or a new one. */
  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.productTypeName)
  productType: string | null;
}
