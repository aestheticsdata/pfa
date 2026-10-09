import evaluateAmountExpression from "@lib/amountExpression";

import type { CategoryOption } from "@components/spendings/common/spendingModal/schema";
import type {
  GroupDayEntry,
  GroupLineDraft,
  SpendingGroupLinePayload,
} from "@components/spendings/interfaces/spendingGroupTypes";

export const emptyDraft = (category: CategoryOption | null = null, amount = ""): GroupLineDraft => ({
  key: crypto.randomUUID(),
  ID: null,
  category,
  detail: "",
  amount,
});

/**
 * Lines of an existing group, as the editor shows them. A line's category is
 * rebuilt from the row (ID + name + colour), like the single edit does.
 */
export const draftsFromGroup = (group: GroupDayEntry, userID: string | null): GroupLineDraft[] =>
  group.lines.map((line) => ({
    key: line.ID,
    ID: line.ID,
    category: line.category ? { ID: line.categoryID, userID, name: line.category, color: line.categoryColor } : null,
    detail: line.detail ?? "",
    amount: String(line.amount),
  }));

// Numbers joined by + - * /, optionally parenthesised — checked before parsing so
// a half-typed "12+" reads as invalid without the parser logging on each key.
const EXPRESSION_SHAPE = /^\(*\d+(\.\d+)?\)*([+\-*/]\(*\d+(\.\d+)?\)*)*$/;
const HAS_OPERATOR = /\d\s*[+\-*/]\s*[\d(]/;

/** Spaces dropped and decimal commas read as points: "12+3,5" → "12+3.5". */
const normalizeAmount = (amount: string) => amount.replace(/\s/g, "").replaceAll(",", ".");

/**
 * A line's amount: the typed expression evaluated with the single amount
 * field's parser, rounded to the cent, or null when unusable or not positive.
 */
export const draftAmount = (draft: GroupLineDraft): number | null => {
  const input = normalizeAmount(draft.amount);
  if (!EXPRESSION_SHAPE.test(input)) return null;
  const value = evaluateAmountExpression(input);
  return value !== null && value > 0 ? Math.round(value * 100) / 100 : null;
};

/** Whether the typed amount is a sum (or any operation) rather than a plain number. */
export const isAmountExpression = (amount: string) => HAS_OPERATOR.test(amount);

/** The request lines, or the keys of the lines whose amount is missing or invalid. */
export const toLinePayloads = (drafts: GroupLineDraft[]) => {
  const invalidKeys = drafts.filter((d) => draftAmount(d) === null).map((d) => d.key);
  const lines: SpendingGroupLinePayload[] = drafts.map((d) => ({
    ...(d.ID ? { ID: d.ID } : {}),
    detail: d.detail,
    amount: draftAmount(d) ?? 0,
    category: d.category,
  }));
  return { lines, invalidKeys };
};

/** Footer of the editor: line count, distinct categories, running total. */
export const summarizeDrafts = (drafts: GroupLineDraft[]) => ({
  lines: drafts.length,
  categories: new Set(drafts.map((d) => d.category?.name.toLowerCase() ?? "")).size,
  total: drafts.reduce((sum, d) => sum + (draftAmount(d) ?? 0), 0),
});
