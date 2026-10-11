import { readdirSync, readFileSync } from "node:fs";
import { AuthResponseSchema } from "@src/schemas/auth";
import { CategoryListSchema } from "@src/schemas/categories";
import { CategoryStatsResponseSchema } from "@src/schemas/categoryStats";
import {
  DailyProjectionSchema,
  DashboardResponseSchema,
  MonthlyIncomeResponseSchema,
  MonthlyStatsSchema,
  WeeklyStatsSchema,
} from "@src/schemas/dashboard";
import { ExceptionalListSchema, ExceptionalYearsSchema, RegularMonthlyAverageSchema } from "@src/schemas/exceptionals";
import {
  LabelSuggestionListSchema,
  RecurringListSchema,
  RecurringsDrawnSchema,
  SpendingListSchema,
  SpendingSearchPageSchema,
  SpendingYearsSchema,
} from "@src/schemas/spendings";
import {
  BiggestRegularExpenseResponseSchema,
  BusiestWeekResponseSchema,
  CategoryTrendsResponseSchema,
  DailyStatsResponseSchema,
  SearchTimelineResponseSchema,
  SpendingPaceResponseSchema,
  StatisticsResponseSchema,
  WeekdayCategoriesResponseSchema,
} from "@src/schemas/stats";
import { describe, expect, it } from "vitest";

import type { z } from "zod";

/**
 * The API contract (PFA-177): every fixture is a real, anonymised api response, captured by
 * `scripts/captureApiFixtures.mjs`. Each one must parse with the schema its fetcher uses — and
 * since response schemas are strict outside production, a field the api added fails here too.
 * Red means the schema and the api have diverged: fix the schema, or re-capture after a back
 * change (`front/docs/api-contract-fixtures.md`).
 */
const CONTRACTS: Record<string, z.ZodType> = {
  "auth.me": AuthResponseSchema,
  "categories.list": CategoryListSchema,
  "categoryStats.all": CategoryStatsResponseSchema,
  "categoryStats.range": CategoryStatsResponseSchema,
  "dashboard.month": DashboardResponseSchema,
  "dashboard.emptyMonth": DashboardResponseSchema,
  "dashboard.projection": DailyProjectionSchema,
  "dashboard.projectionFirstMonth": DailyProjectionSchema,
  "dashboard.monthlyIncome": MonthlyIncomeResponseSchema,
  "dashboard.monthlyStats": MonthlyStatsSchema,
  "dashboard.weeklyStats": WeeklyStatsSchema,
  "exceptionals.year": ExceptionalListSchema,
  "exceptionals.all": ExceptionalListSchema,
  "exceptionals.years": ExceptionalYearsSchema,
  "exceptionals.regularMonthlyAverage": RegularMonthlyAverageSchema,
  "recurrings.month": RecurringListSchema,
  "recurrings.drawn": RecurringsDrawnSchema,
  "spendings.month": SpendingListSchema,
  "spendings.emptyMonth": SpendingListSchema,
  "spendings.years": SpendingYearsSchema,
  "spendings.search": SpendingSearchPageSchema,
  "spendings.searchNextPage": SpendingSearchPageSchema,
  "spendings.searchYear": SpendingSearchPageSchema,
  "spendings.labelSuggestions": LabelSuggestionListSchema,
  "stats.busiestWeek": BusiestWeekResponseSchema,
  "stats.busiestWeekEmptyMonth": BusiestWeekResponseSchema,
  "stats.spendingPace": SpendingPaceResponseSchema,
  "stats.categoryTrends": CategoryTrendsResponseSchema,
  "stats.categoryTrendsFirstMonth": CategoryTrendsResponseSchema,
  "stats.dailyStats": DailyStatsResponseSchema,
  "stats.dailyStatsEmptyYear": DailyStatsResponseSchema,
  "stats.weekdayCategories": WeekdayCategoriesResponseSchema,
  "stats.biggestRegularExpense": BiggestRegularExpenseResponseSchema,
  "stats.biggestRegularExpenseEmptyYear": BiggestRegularExpenseResponseSchema,
  "stats.statistics": StatisticsResponseSchema,
  "stats.searchTimelineDay": SearchTimelineResponseSchema,
  "stats.searchTimelineWeek": SearchTimelineResponseSchema,
};

const FIXTURES_DIR = new URL("./fixtures/", import.meta.url);
const fixtureNames = readdirSync(FIXTURES_DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => file.slice(0, -".json".length));

const readFixture = (name: string): unknown => JSON.parse(readFileSync(new URL(`${name}.json`, FIXTURES_DIR), "utf8"));

describe("API contract fixtures", () => {
  it("has a schema for every fixture, and a fixture for every schema", () => {
    expect(fixtureNames.toSorted()).toEqual(Object.keys(CONTRACTS).toSorted());
  });

  it.each(Object.entries(CONTRACTS))("%s parses with its schema", (name, schema) => {
    const result = schema.safeParse(readFixture(name));
    expect(result.error?.issues ?? []).toEqual([]);
  });
});
