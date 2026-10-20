import { apiObject } from "@src/schemas/apiObject";
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
export const SpendingItemSchema = apiObject({
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
  // A line of a group (PFA-189): `label` already reads "<group> — <detail>";
  // `detail` is the part after the group name, null on a plain spending.
  groupID: z.string().nullable(),
  detail: z.string().nullable(),
  // Joined by GET /spendings only — the search page does not send it.
  groupLabel: z.string().nullish(),
  // How many receipt lines were saved for the row (PFA-214); 0 when none.
  lineCount: z.number(),
  // Where it was bought, when its receipt named the store (PFA-218): the store's
  // ID as stored on the row, and its name joined by the API.
  storeID: z.string().nullable(),
  storeName: z.string().nullable(),
});

// The list and series payloads are the heavy parses, so they go through
// `z.compile()` (PFA-176): same output, same errors, flat generated code.
export const SpendingListSchema = z.compile(z.array(SpendingItemSchema));
export type SpendingItem = z.infer<typeof SpendingItemSchema>;

// Whole-history search page (COS-114): one keyset page of matches, the cursor to
// fetch the next page (null at the end), and the unbounded total — sent only on
// the first page, so the UI can say "N results" without recounting every page.
export const SpendingSearchPageSchema = z.compile(
  apiObject({
    items: SpendingListSchema,
    nextCursor: z.string().nullable(),
    total: z.number().optional(),
  }),
);

// Years the user has spendings in (newest first) — the search modal's year filter.
export const SpendingYearsSchema = z.array(z.number());

// Label autocomplete for the spending modal (COS-23): the user's own past
// spending labels, filtered by prefix and ranked by frequency, each with its
// most-used category so selecting one can pre-fill it. `category` is null when
// the label was only ever used uncategorized.
export const LabelSuggestionSchema = apiObject({
  label: z.string(),
  category: z.string().nullable(),
});
export const LabelSuggestionListSchema = z.array(LabelSuggestionSchema);
export type LabelSuggestion = z.infer<typeof LabelSuggestionSchema>;

export const RecurringItemSchema = apiObject({
  ID: z.string(),
  amount: numberLikeSchema,
  // Flattened from the joined category, like a spending (PFA-38).
  category: z.string().nullable(),
  categoryColor: z.string().nullable(),
  categoryID: z.string().nullable(),
  currency: z.string().nullable(),
  dateFrom: z.string(),
  dateTo: z.string(),
  itemType: itemTypeSchema,
  label: z.string(),
  userID: z.string(),
});

export const RecurringListSchema = z.compile(z.array(RecurringItemSchema));
export type RecurringItem = z.infer<typeof RecurringItemSchema>;

// Real year-to-date "Already debited" (COS-49) — GET /recurrings/drawn. The server
// sums the actual per-month recurring rows from January through the current month.
export const RecurringsDrawnSchema = apiObject({ drawn: numberLikeSchema });

// Response of POST /spendings: the new row's ID, so the receipt upload can
// chain on it in the same creation flow (PFA-5).
export const CreateSpendingResponseSchema = apiObject({ ID: z.string() });

// Response of POST /spendings/groups: the group and its lines' IDs, so the
// group's receipt can be uploaded on all of them right after (PFA-189).
export const CreateSpendingGroupResponseSchema = apiObject({ ID: z.string(), spendingIDs: z.array(z.string()) });

// Response of POST /spendings/groups/merge: the merged row and the receipt it kept.
export const MergeResponseSchema = apiObject({ ID: z.string(), invoicefile: z.string().nullable() });

export const SpendingMutationPayloadSchema = z.object({
  date: z.string().nullable().optional(),
  label: z.string().min(1),
  amount: numberLikeSchema,
  category: SpendingCategoryInputSchema.nullable().optional(),
  currency: z.string(),
  id: z.string().optional(),
});

export type SpendingMutationPayload = z.infer<typeof SpendingMutationPayloadSchema>;

export const RecurringMutationPayloadSchema = z.object({
  label: z.string().min(1),
  amount: numberLikeSchema,
  category: SpendingCategoryInputSchema.nullable().optional(),
  id: z.string().optional(),
});
