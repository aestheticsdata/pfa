import { z } from "zod";

const numberLikeSchema = z.preprocess(
  (value) => (typeof value === "number" || typeof value === "string" ? value : NaN),
  z.coerce.number().finite(),
);

export const ExceptionalItemSchema = z.object({
  ID: z.string(),
  userID: z.string(),
  date: z.string(),
  itemType: z.string(),
  label: z.string(),
  description: z.string().nullable().optional(),
  amount: numberLikeSchema,
  currency: z.string().nullable().optional(),
  categoryName: z.string().nullable().optional(),
  categoryColor: z.string().nullable().optional(),
  invoicefile: z.string().nullable().optional(),
});

export const ExceptionalListSchema = z.array(ExceptionalItemSchema);
export type ExceptionalItem = z.infer<typeof ExceptionalItemSchema>;

export const ExceptionalMutationPayloadSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  label: z.string().min(1),
  description: z.string().optional().nullable(),
  amount: numberLikeSchema,
  currency: z.string().optional(),
  categoryName: z.string().optional().nullable(),
  categoryColor: z.string().optional().nullable(),
});

export type ExceptionalMutationPayload = z.infer<typeof ExceptionalMutationPayloadSchema>;

export const ExceptionalYearsSchema = z.array(z.number().int());
