import { apiObject } from "@src/schemas/apiObject";
import { FIELD_LIMITS } from "@src/schemas/fieldLimits";
import { numberLikeSchema } from "@src/schemas/primitives";
import { z } from "zod";

// The units a product's size is kept in (PFA-219); no size: sold by the piece.
export const sizeUnitSchema = z.enum(["g", "kg", "ml", "cl", "l"]);
export type SizeUnit = z.infer<typeof sizeUnitSchema>;

// One line of a spending's receipt (PFA-214): what was bought, what it cost,
// how many of what size, and the generic product it is (PFA-219).
export const ReceiptLineSchema = apiObject({
  label: z.string(),
  amount: numberLikeSchema,
  quantity: numberLikeSchema,
  size: numberLikeSchema.nullable(),
  sizeUnit: sizeUnitSchema.nullable(),
  productType: z.string().nullable(),
});
export type ReceiptLine = z.infer<typeof ReceiptLineSchema>;

// A store is a name and an address: two shops of one chain are priced apart (PFA-219).
export const StoreIdentitySchema = apiObject({ name: z.string(), address: z.string().nullable() });
export type StoreIdentity = z.infer<typeof StoreIdentitySchema>;

// GET and PUT /spendings/:id/lines: the lines and the store (PFA-218).
export const ReceiptLinesResponseSchema = apiObject({
  lines: z.array(ReceiptLineSchema),
  store: StoreIdentitySchema.nullable(),
});
export type SavedReceipt = z.infer<typeof ReceiptLinesResponseSchema>;

// POST /spendings/:id/lines/ocr: what the OCR read, and the receipt's own total when found.
export const ReceiptProposalSchema = apiObject({
  lines: z.array(ReceiptLineSchema),
  total: numberLikeSchema.nullable(),
  // The store read on the receipt, or the user's known shop it is.
  store: StoreIdentitySchema.nullable(),
});
export type ReceiptProposal = z.infer<typeof ReceiptProposalSchema>;

export const SaveReceiptLinesPayloadSchema = z.object({
  lines: z.array(
    z.object({
      label: z.string().trim().min(1).max(FIELD_LIMITS.receiptLineLabel),
      amount: z.number(),
      quantity: z.number().positive(),
      size: z.number().positive().nullable(),
      sizeUnit: sizeUnitSchema.nullable(),
      productType: z.string().trim().max(FIELD_LIMITS.productTypeName).nullable(),
    }),
  ),
  store: z
    .object({
      name: z.string().trim().min(1).max(FIELD_LIMITS.storeName),
      address: z.string().trim().max(FIELD_LIMITS.storeAddress).nullable(),
    })
    .nullable(),
});
export type SaveReceiptLinesPayload = z.infer<typeof SaveReceiptLinesPayloadSchema>;

// GET /stores: the user's stores, for the store field (PFA-218).
export const StoreSchema = apiObject({ ID: z.string(), name: z.string(), address: z.string().nullable() });
export const StoreListSchema = z.array(StoreSchema);
export type Store = z.infer<typeof StoreSchema>;

// GET /product-types: the user's generic products, for each line's type (PFA-219).
export const ProductTypeSchema = apiObject({ ID: z.string(), name: z.string() });
export const ProductTypeListSchema = z.array(ProductTypeSchema);
export type ProductType = z.infer<typeof ProductTypeSchema>;

// GET/POST /receipt-proposals: the bulk read's progress (PFA-223).
export const BulkReadStatusSchema = apiObject({
  candidates: z.number(),
  queued: z.number(),
  ready: z.number(),
  failed: z.number(),
});
export type BulkReadStatus = z.infer<typeof BulkReadStatusSchema>;

// GET /receipt-proposals/next: the next read receipt to review, or null.
export const PendingProposalSchema = apiObject({
  spendingID: z.string(),
  label: z.string(),
  amount: numberLikeSchema,
  date: z.string(),
  proposal: ReceiptProposalSchema,
}).nullable();
export type PendingProposal = NonNullable<z.infer<typeof PendingProposalSchema>>;
