import { apiObject } from "@src/schemas/apiObject";
import { itemTypeSchema, numberLikeSchema } from "@src/schemas/primitives";
import { z } from "zod";

export const ExceptionalItemSchema = apiObject({
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

// Compiled (PFA-176): list payloads are the heavy parses.
export const ExceptionalListSchema = z.compile(z.array(ExceptionalItemSchema));
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

// Average monthly regular spending of a year — GET /regular-monthly-average.
// Backs the Exceptionals page.
export const RegularMonthlyAverageSchema = apiObject({
  monthlyAverage: z.number(),
});

export type RegularMonthlyAverage = z.infer<typeof RegularMonthlyAverageSchema>;
