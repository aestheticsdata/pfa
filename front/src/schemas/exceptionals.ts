import { itemTypeSchema, numberLikeSchema } from "@src/schemas/primitives";
import { z } from "zod";

export const ExceptionalItemSchema = z.object({
  ID: z.string(),
  userID: z.string(),
  date: z.string(),
  itemType: itemTypeSchema,
  label: z.string(),
  description: z.string().nullable(),
  amount: numberLikeSchema,
  currency: z.string().nullable(),
  categoryName: z.string().nullable(),
  categoryColor: z.string().nullable(),
  invoicefile: z.string().nullable(),
});

export const ExceptionalListSchema = z.array(ExceptionalItemSchema);
export type ExceptionalItem = z.infer<typeof ExceptionalItemSchema>;

export const ExceptionalMutationPayloadSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  label: z.string().min(1),
  description: z.string().nullable().optional(),
  amount: numberLikeSchema,
  currency: z.string().optional(),
  categoryName: z.string().nullable().optional(),
  categoryColor: z.string().nullable().optional(),
});

export type ExceptionalMutationPayload = z.infer<typeof ExceptionalMutationPayloadSchema>;

export const ExceptionalYearsSchema = z.array(z.number().int());
