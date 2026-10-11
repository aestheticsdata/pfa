import { apiObject } from "@src/schemas/apiObject";
import { numberLikeSchema } from "@src/schemas/primitives";
import { sizeUnitSchema } from "@src/schemas/receiptLines";
import { z } from "zod";

// Price comparison by store per product type (PFA-220).

export const priceBasisSchema = z.enum(["kg", "l", "piece"]);
export type PriceBasis = z.infer<typeof priceBasisSchema>;

// GET /prices: the product types bought at a known store.
export const ProductTypeSummarySchema = apiObject({
  ID: z.string(),
  name: z.string(),
  stores: z.number(),
  purchases: z.number(),
});
export const ProductTypeSummaryListSchema = z.array(ProductTypeSummarySchema);
export type ProductTypeSummary = z.infer<typeof ProductTypeSummarySchema>;

export const StorePriceSchema = apiObject({
  storeID: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  lastUnitPrice: numberLikeSchema,
  averageUnitPrice: numberLikeSchema,
  lastAmount: numberLikeSchema,
  lastQuantity: numberLikeSchema,
  lastSize: numberLikeSchema.nullable(),
  lastSizeUnit: sizeUnitSchema.nullable(),
  lastDate: z.string(),
  purchases: z.number(),
  cheapest: z.boolean(),
  history: z.array(apiObject({ date: z.string(), unitPrice: numberLikeSchema })),
});
export type StorePrice = z.infer<typeof StorePriceSchema>;

export const BasisComparisonSchema = apiObject({
  basis: priceBasisSchema,
  stores: z.array(StorePriceSchema),
});
export type BasisComparison = z.infer<typeof BasisComparisonSchema>;

// GET /prices/:typeID: one type, its stores ranked per basis, cheapest first.
export const PriceComparisonSchema = apiObject({
  ID: z.string(),
  name: z.string(),
  comparisons: z.array(BasisComparisonSchema),
});
