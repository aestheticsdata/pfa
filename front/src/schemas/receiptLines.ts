import { apiObject } from "@src/schemas/apiObject";
import { FIELD_LIMITS } from "@src/schemas/fieldLimits";
import { numberLikeSchema } from "@src/schemas/primitives";
import { z } from "zod";

// One line of a spending's receipt (PFA-214): what was bought, what it cost.
export const ReceiptLineSchema = apiObject({
  label: z.string(),
  amount: numberLikeSchema,
});
export type ReceiptLine = z.infer<typeof ReceiptLineSchema>;

// GET and PUT /spendings/:id/lines.
export const ReceiptLinesResponseSchema = apiObject({ lines: z.array(ReceiptLineSchema) });

// POST /spendings/:id/lines/ocr: what the OCR read, and the receipt's own total when found.
export const ReceiptProposalSchema = apiObject({
  lines: z.array(ReceiptLineSchema),
  total: numberLikeSchema.nullable(),
});
export type ReceiptProposal = z.infer<typeof ReceiptProposalSchema>;

export const SaveReceiptLinesPayloadSchema = z.object({
  lines: z.array(
    z.object({
      label: z.string().trim().min(1).max(FIELD_LIMITS.receiptLineLabel),
      amount: z.number(),
    }),
  ),
});
export type SaveReceiptLinesPayload = z.infer<typeof SaveReceiptLinesPayloadSchema>;
