import { itemTypeSchema, numberLikeSchema } from "@src/schemas/primitives";
import { z } from "zod";

export const SpendingCategoryInputSchema = z.object({
  ID: z.string().nullable(),
  userID: z.string().nullable(),
  name: z.string(),
  color: z.string().nullable(),
});

// Response shape of GET /spendings and the search page. Every field below is a
// real column returned by an unprojected Prisma `findMany`, so nullable fields
// arrive as `null`, never absent — hence `.nullable()` without `.optional()`
// (COS-107).
export const SpendingItemSchema = z.object({
  ID: z.string(),
  amount: numberLikeSchema,
  category: z.string().nullable(),
  categoryColor: z.string().nullable(),
  categoryID: z.string().nullable(),
  currency: z.string().nullable(),
  date: z.string(),
  invoicefile: z.string().nullable(),
  itemType: itemTypeSchema,
  label: z.string(),
  userID: z.string(),
});

export const SpendingListSchema = z.array(SpendingItemSchema);
export type SpendingItem = z.infer<typeof SpendingItemSchema>;

// Whole-history search page (COS-114): one keyset page of matches, the cursor to
// fetch the next page (null at the end), and the unbounded total — sent only on
// the first page, so the UI can say "N results" without recounting every page.
export const SpendingSearchPageSchema = z.object({
  items: SpendingListSchema,
  nextCursor: z.string().nullable(),
  total: z.number().optional(),
});

// Years the user has spendings in (newest first) — the search modal's year filter.
export const SpendingYearsSchema = z.array(z.number());

// Label autocomplete for the spending modal (COS-23): the user's own past
// spending labels, filtered by prefix and ranked by frequency, each with its
// most-used category so selecting one can pre-fill it. `category` is null when
// the label was only ever used uncategorized.
export const LabelSuggestionSchema = z.object({
  label: z.string(),
  category: z.string().nullable(),
});
export const LabelSuggestionListSchema = z.array(LabelSuggestionSchema);
export type LabelSuggestion = z.infer<typeof LabelSuggestionSchema>;

export const RecurringItemSchema = z.object({
  ID: z.string(),
  amount: numberLikeSchema,
  currency: z.string().nullable(),
  dateFrom: z.string(),
  dateTo: z.string(),
  itemType: itemTypeSchema,
  label: z.string(),
  userID: z.string(),
});

export const RecurringListSchema = z.array(RecurringItemSchema);
export type RecurringItem = z.infer<typeof RecurringItemSchema>;

// Real year-to-date "Already debited" (COS-49) — GET /recurrings/drawn. The server
// sums the actual per-month recurring rows from January through the current month.
export const RecurringsDrawnSchema = z.object({ drawn: numberLikeSchema });

// Response of POST /spendings: the new row's ID, so the receipt upload can
// chain on it in the same creation flow (PFA-5).
export const CreateSpendingResponseSchema = z.object({ ID: z.string() });

export const SpendingMutationPayloadSchema = z.object({
  date: z.string().nullable().optional(),
  label: z.string().min(1),
  amount: numberLikeSchema,
  category: SpendingCategoryInputSchema.nullable().optional(),
  currency: z.string(),
  userID: z.string(),
  id: z.string().optional(),
});

export type SpendingMutationPayload = z.infer<typeof SpendingMutationPayloadSchema>;

export const RecurringMutationPayloadSchema = z.object({
  label: z.string().min(1),
  amount: numberLikeSchema,
  id: z.string().optional(),
});
