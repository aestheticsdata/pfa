import { DailyProjectionSchema } from "@src/schemas/dashboard";
import { ExceptionalListSchema } from "@src/schemas/exceptionals";
import { RecurringListSchema, SpendingListSchema, SpendingSearchPageSchema } from "@src/schemas/spendings";
import {
  CategoryTrendsResponseSchema,
  DailyStatsResponseSchema,
  SearchTimelineResponseSchema,
  StatisticsResponseSchema,
} from "@src/schemas/stats";

import type { z } from "zod";

/**
 * The heavy response schemas run on `z.compile()` (PFA-176). A schema the
 * compiler refuses silently stays on the runtime parser, so these lock that the
 * compilation really happened — and that a rejected payload still reports the
 * exact same issues as the runtime parser does.
 */
const COMPILED: Record<string, z.ZodType> = {
  SpendingListSchema,
  SpendingSearchPageSchema,
  RecurringListSchema,
  ExceptionalListSchema,
  StatisticsResponseSchema,
  CategoryTrendsResponseSchema,
  DailyStatsResponseSchema,
  SearchTimelineResponseSchema,
  DailyProjectionSchema,
};

// Wrong at every level: a non-array where a list is expected, a list of junk
// rows where an object is, so each schema rejects it down a different path.
const INVALID_PAYLOADS: unknown[] = [null, "x", [{ ID: 1, amount: "abc" }], { items: [{}], trends: [{}], days: [{}] }];

describe.each(Object.entries(COMPILED))("%s", (_name, schema) => {
  it("is compiled, not left on the runtime parser", () => {
    expect(typeof schema._zod.bag.validator).toBe("function");
    expect(typeof schema.clone()._zod.bag.validator).toBe("undefined");
  });

  it.each(INVALID_PAYLOADS)("rejects %j with the runtime parser's exact issues", (payload) => {
    const compiled = schema.safeParse(payload);
    const runtime = schema.clone().safeParse(payload);
    expect(compiled.success).toBe(false);
    expect(compiled.error?.issues).toEqual(runtime.error?.issues);
    expect(compiled.error?.message).toBe(runtime.error?.message);
  });
});

// The compiled fast path returns its own output on success — check it builds
// the same value as the runtime, coercions, transforms and defaults included.
const VALID: [z.ZodType, unknown][] = [
  [
    SpendingListSchema,
    [
      {
        ID: "s1",
        amount: "12.50",
        category: "Groceries",
        categoryColor: "#123456",
        categoryID: "c1",
        currency: "EUR",
        date: "2026-03-04",
        invoicefile: null,
        itemType: "spending",
        label: "Market",
        userID: "u1",
        groupID: null,
        detail: null,
        extra: "stripped",
      },
    ],
  ],
  [
    StatisticsResponseSchema,
    { colors: { Groceries: "#123456" }, data: { "2026": [{ month: "janv.", Groceries: "10" }] } },
  ],
  [DailyProjectionSchema, { source: "previousMonth", referenceMonth: "2026-02", dailyTotals: [1, "2.5"] }],
];

it.each(VALID)("parses a valid payload to the runtime parser's exact output (%#)", (schema, payload) => {
  expect(schema.parse(payload)).toEqual(schema.clone().parse(payload));
});
