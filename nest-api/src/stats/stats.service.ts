import { Injectable } from "@nestjs/common";
import { endOfMonth, format, getDay, getDaysInMonth, getMonth, getYear, parse, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { escapeLikeQuery, MIN_SEARCH_LENGTH, spendingSearchTextWhere } from "@spendings/search-where.helper";
import { PrismaService } from "../prisma/prisma.service";

import type { StatisticsResponse } from "@stats/dto/statistics-response.interface";
import type { CategoryStat, CategoryStatsResponse } from "@stats/dto/category-stats-response.interface";
import type { DailyStat, DailyStatsResponse } from "@stats/dto/daily-stats-response.interface";
import type { BiggestRegularExpenseResponse } from "@stats/dto/biggest-regular-expense-response.interface";
import type { CategoryTrendPoint, CategoryTrendsResponse } from "@stats/dto/category-trends-response.interface";
import type { BusiestWeekResponse } from "@stats/dto/busiest-week-response.interface";
import type { SpendingPaceResponse } from "@stats/dto/spending-pace-response.interface";
import type { WeekdayCategoriesResponse, WeekdayCategory } from "@stats/dto/weekday-categories-response.interface";
import type { SearchTimelineBucket, SearchTimelineResponse } from "@stats/dto/search-timeline-response.interface";

/** Rounds to 2 decimal places to avoid JS float precision issues. */
const roundCurrency = (n: number): number => Math.round(n);

/** Rounds to the cent, killing the float noise of summed Prisma Decimals. */
const round2 = (n: number): number => Math.round(n * 100) / 100;

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getWeeklyStats(start: string, userID: string): Promise<number[]> {
    const startDate = new Date(start);
    const monthStart = startOfMonth(startDate);
    const monthEnd = endOfMonth(startDate);

    const spendings = await this.prisma.spendings.findMany({
      where: {
        userID,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: { date: true, amount: true },
    });

    return this.makeRange(spendings, startDate);
  }

  private makeRange(monthSpending: { date: Date; amount: { toString: () => string } }[], startDate: Date): number[] {
    const ranges: number[] = [];
    const dayNumberFromMonthStart = getDay(startDate);
    const firstSlice = 7 - dayNumberFromMonthStart;
    const numberOfDaysInMonth = getDaysInMonth(startDate);
    ranges.push(firstSlice);
    const numberOfFullWeeks = Math.floor((numberOfDaysInMonth - firstSlice) / 7);
    for (let i = 0; i < numberOfFullWeeks; i += 1) {
      ranges.push(7);
    }
    const remainingNumberOfDays = numberOfDaysInMonth - (firstSlice + 7 * numberOfFullWeeks);
    if (remainingNumberOfDays !== 0) {
      ranges.push(remainingNumberOfDays);
    }

    const totalsByWeek: number[] = [];
    let dayShifter = 0;
    for (let slice_i = 0; slice_i < ranges.length; slice_i += 1) {
      totalsByWeek[slice_i] = 0;
      let tempTotal = 0;
      for (let day_of_slice_i = 0; day_of_slice_i < ranges[slice_i]; day_of_slice_i += 1) {
        const targetDate = new Date(getYear(startDate), getMonth(startDate), day_of_slice_i + 1 + dayShifter);
        const targetStr = format(targetDate, "yyyy-MM-dd");
        const spendingByDay = monthSpending.filter((o) => format(o.date, "yyyy-MM-dd") === targetStr);
        tempTotal = spendingByDay.reduce((acc, curr) => acc + Number(curr.amount.toString()), 0);
        if (spendingByDay.length !== 0) {
          totalsByWeek[slice_i] = roundCurrency((totalsByWeek[slice_i] ?? 0) + tempTotal);
        }
      }
      dayShifter += ranges[slice_i];
    }
    return totalsByWeek;
  }

  /**
   * The calendar week-range of a month with the most one-off spendings (COS-139).
   * "Week" = the month's calendar-aligned Sun→Sat ranges, truncated at the month
   * edges — the same slices the rest of the app uses (datepicker, Dépenses,
   * weekly ceiling), NOT a rolling window. Reads the one-off `Spendings` table
   * only, so recurrings and exceptionals — which live in their own tables — are
   * excluded by construction. Counts per day over a half-open UTC month range and
   * buckets in JS (like the daily stats) so day keys are timezone-safe. Ties
   * resolve to the earliest range; returns count 0 / null bounds for a month with
   * no spending. Backs the dashboard's 4th ribbon insight.
   */
  async getBusiestWeek(start: string, userID: string): Promise<BusiestWeekResponse> {
    const startDate = new Date(start);
    const year = startDate.getUTCFullYear();
    const month = startDate.getUTCMonth();

    const grouped = await this.prisma.spendings.groupBy({
      by: ["date"],
      where: { userID, date: { gte: new Date(Date.UTC(year, month, 1)), lt: new Date(Date.UTC(year, month + 1, 1)) } },
      _count: true,
    });

    const ranges = this.weekRangesOfMonth(year, month);
    const counts = new Array<number>(ranges.length).fill(0);
    for (const group of grouped) {
      const day = group.date.getUTCDate();
      const index = ranges.findIndex((range) => day >= range.startDay && day <= range.endDay);
      if (index !== -1) {
        counts[index] += group._count;
      }
    }

    // Strict `>` keeps the earliest range on ties.
    let bestIndex = -1;
    let bestCount = 0;
    for (let i = 0; i < ranges.length; i += 1) {
      if (counts[i] > bestCount) {
        bestCount = counts[i];
        bestIndex = i;
      }
    }

    if (bestIndex === -1) {
      return { count: 0, from: null, to: null };
    }

    const { startDay, endDay } = ranges[bestIndex];
    return {
      count: bestCount,
      from: new Date(Date.UTC(year, month, startDay)).toISOString().slice(0, 10),
      to: new Date(Date.UTC(year, month, endDay)).toISOString().slice(0, 10),
    };
  }

  /**
   * A month's calendar-aligned week slices as inclusive day-of-month ranges: a
   * (possibly short) first slice from day 1 to the first Saturday, full Sun→Sat
   * weeks, then a (possibly short) trailing slice. Same slicing as `makeRange`,
   * but the first slice is derived from the 1st of the month (UTC) so it is
   * correct whatever day `start` falls on.
   */
  private weekRangesOfMonth(year: number, month: number): { startDay: number; endDay: number }[] {
    const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const ranges: { startDay: number; endDay: number }[] = [];
    let day = 1;
    let sliceLength = 7 - firstWeekday;
    while (day <= daysInMonth) {
      const endDay = Math.min(day + sliceLength - 1, daysInMonth);
      ranges.push({ startDay: day, endDay });
      day = endDay + 1;
      sliceLength = 7;
    }
    return ranges;
  }

  /**
   * The total one-off spending of each of the three months before the reference
   * month (COS-40), so the dashboard's "Sur le rythme" insight can compare the
   * current month's daily pace to the recent average. Reads the one-off
   * `Spendings` table only (recurrings/exceptionals live in their own tables), the
   * same basis as the projection and the other ribbon insights. Sums each month
   * over a half-open UTC range so month keys are timezone-safe; `Date.UTC`
   * normalizes negative months, so no manual year wrap is needed. Returned
   * newest→oldest (M-1, M-2, M-3); an empty month comes back as total 0 and is
   * excluded — not averaged in — on the front.
   */
  async getSpendingPace(start: string, userID: string): Promise<SpendingPaceResponse> {
    const startDate = new Date(start);
    const year = startDate.getUTCFullYear();
    const month = startDate.getUTCMonth();

    const months = await Promise.all(
      [1, 2, 3].map(async (monthsBack) => {
        const gte = new Date(Date.UTC(year, month - monthsBack, 1));
        const lt = new Date(Date.UTC(year, month - monthsBack + 1, 1));
        const result = await this.prisma.spendings.aggregate({
          where: { userID, date: { gte, lt } },
          _sum: { amount: true },
        });
        return { month: gte.toISOString().slice(0, 10), total: round2(Number(result._sum.amount ?? 0)) };
      }),
    );

    return { months };
  }

  async getRegularMonthlyAverage(yearStr: string, userID: string): Promise<{ monthlyAverage: number }> {
    const year = parseInt(yearStr, 10);
    if (Number.isNaN(year)) {
      return { monthlyAverage: 0 };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    if (year > currentYear) {
      return { monthlyAverage: 0 };
    }

    const startDate = new Date(year, 0, 1);
    const isCurrentYear = year === currentYear;
    const endDate = isCurrentYear ? now : new Date(year, 11, 31);

    const result = await this.prisma.spendings.aggregate({
      where: {
        userID,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    const total = Number(result._sum.amount ?? 0);
    if (total === 0) {
      return { monthlyAverage: 0 };
    }

    const msPerMonth = 1000 * 60 * 60 * 24 * (365.25 / 12);
    const monthsElapsed = (endDate.getTime() - startDate.getTime()) / msPerMonth;
    if (monthsElapsed <= 0) {
      return { monthlyAverage: 0 };
    }

    return { monthlyAverage: total / monthsElapsed };
  }

  async getMonthlyStats(
    from: string,
    userID: string,
  ): Promise<{ spendingsSum: { amount: string }; recurringsSum: { amount: string } }> {
    const fromDate = new Date(from);
    const start = format(startOfMonth(fromDate), "yyyy-MM-dd");
    const end = format(endOfMonth(fromDate), "yyyy-MM-dd");

    const [recurringsResult, spendingsResult] = await Promise.all([
      this.prisma.recurrings.aggregate({
        where: {
          userID,
          dateFrom: new Date(start),
          dateTo: new Date(end),
        },
        _sum: { amount: true },
      }),
      this.prisma.spendings.aggregate({
        where: {
          userID,
          date: {
            gte: new Date(start),
            lte: new Date(end),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const recurringsSum = {
      amount: String(recurringsResult._sum.amount ?? 0),
    };
    const spendingsSum = {
      amount: String(spendingsResult._sum.amount ?? 0),
    };

    return { spendingsSum, recurringsSum };
  }

  /**
   * Turns inclusive calendar-date bounds (yyyy-MM-dd) into a half-open UTC range
   * (`gte`/`lt`), matching how spending dates are stored (calendar date at UTC
   * midnight) and how the daily/yearly stats query. `to` is made inclusive by
   * advancing the exclusive upper bound to the next UTC day. Returns undefined
   * when neither bound is given (all-time).
   */
  private dateWindow(from?: string, to?: string): { gte?: Date; lt?: Date } | undefined {
    const window: { gte?: Date; lt?: Date } = {};
    if (from) {
      window.gte = new Date(`${from}T00:00:00.000Z`);
    }
    if (to) {
      window.lt = new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000);
    }
    return window.gte || window.lt ? window : undefined;
  }

  /**
   * Usage aggregate per category: number of spendings and total amount spent,
   * grouped by category. With no date bounds it covers the user's whole history
   * (Categories page); with `from`/`to` it scopes to that window — the spending
   * modal passes the current year to date so its "Fréquentes" quick-picks rank
   * on recent usage (COS-137). `totalSpent` sums every spending in scope (incl.
   * uncategorized) so the front can derive each category's share.
   */
  async getCategoryStats(userID: string, from?: string, to?: string): Promise<CategoryStatsResponse> {
    const date = this.dateWindow(from, to);
    const grouped = await this.prisma.spendings.groupBy({
      by: ["categoryID"],
      where: { userID, ...(date ? { date } : {}) },
      _sum: { amount: true },
      _count: true,
    });

    let totalSpent = 0;
    const byCategory: CategoryStat[] = [];

    for (const group of grouped) {
      const total = Number(group._sum.amount ?? 0);
      totalSpent += total;
      if (group.categoryID !== null) {
        byCategory.push({ categoryID: group.categoryID, count: group._count, total });
      }
    }

    return { totalSpent, byCategory };
  }

  /**
   * Per-day spending totals for a whole year (COS-45). Reads the one-off
   * `Spendings` table only, so recurrings and exceptionals — which live in their
   * own tables — are excluded by construction. Buckets in JS from a half-open
   * UTC range (like the dashboard projection) so day keys are timezone-safe.
   * Feeds the daily heatmap and the day-of-week averages (COS-48).
   */
  async getDailyStats(yearStr: string, userID: string): Promise<DailyStatsResponse> {
    const year = parseInt(yearStr, 10);
    if (Number.isNaN(year)) {
      return { days: [] };
    }

    const yearStart = new Date(Date.UTC(year, 0, 1));
    const nextYearStart = new Date(Date.UTC(year + 1, 0, 1));

    const rows = await this.prisma.spendings.findMany({
      where: { userID, date: { gte: yearStart, lt: nextYearStart } },
      select: { date: true, amount: true },
    });

    const byDay = new Map<string, { total: number; count: number }>();
    for (const row of rows) {
      const key = row.date.toISOString().slice(0, 10);
      const bucket = byDay.get(key) ?? { total: 0, count: 0 };
      bucket.total += Number(row.amount);
      bucket.count += 1;
      byDay.set(key, bucket);
    }

    const days: DailyStat[] = Array.from(byDay.entries())
      .map(([date, { total, count }]) => ({ date, total: round2(total), count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { days };
  }

  /**
   * Dominant spending category per weekday for a year (COS-127): the category
   * with the highest total one-off spend on each weekday (Mon..Sun). Reads the
   * `Spendings` table only (recurrings/exceptionals live elsewhere), scoped to the
   * user, over the same half-open UTC year range as the daily stats. Buckets by
   * UTC weekday in JS so day keys are timezone-safe, resolves the winner's
   * name/colour, and ignores uncategorized spend — a weekday with no categorized
   * spending yields a null category. Backs the day-of-week widget's tooltip.
   */
  async getWeekdayCategories(yearStr: string, userID: string): Promise<WeekdayCategoriesResponse> {
    const emptyWeekdays = (): WeekdayCategory[] => Array.from({ length: 7 }, () => ({ name: null, color: null }));
    const year = parseInt(yearStr, 10);
    if (Number.isNaN(year)) {
      return { weekdays: emptyWeekdays() };
    }

    const yearStart = new Date(Date.UTC(year, 0, 1));
    const nextYearStart = new Date(Date.UTC(year + 1, 0, 1));

    const rows = await this.prisma.spendings.findMany({
      where: { userID, date: { gte: yearStart, lt: nextYearStart }, categoryID: { not: null } },
      select: { date: true, amount: true, categoryID: true },
    });

    // Sum spend per (weekday, category). Monday-based weekday (0 = Mon … 6 = Sun)
    // from the UTC date, matching the daily stats' UTC day keys.
    const totalsByWeekday: Array<Map<string, number>> = Array.from({ length: 7 }, () => new Map());
    for (const row of rows) {
      if (!row.categoryID) {
        continue;
      }
      const dow = (row.date.getUTCDay() + 6) % 7;
      const totals = totalsByWeekday[dow];
      totals.set(row.categoryID, (totals.get(row.categoryID) ?? 0) + Number(row.amount));
    }

    // Winner category id per weekday (highest total; null when the weekday is empty).
    const winnerIds = totalsByWeekday.map((totals) => {
      let winnerId: string | null = null;
      let winnerTotal = 0;
      for (const [categoryID, total] of totals) {
        if (total > winnerTotal) {
          winnerTotal = total;
          winnerId = categoryID;
        }
      }
      return winnerId;
    });

    const ids = [...new Set(winnerIds.filter((id): id is string => id !== null))];
    const categories =
      ids.length > 0
        ? await this.prisma.categories.findMany({
            where: { ID: { in: ids }, OR: [{ userID }, { userID: null }] },
            select: { ID: true, name: true, color: true },
          })
        : [];
    const categoryMap = new Map(categories.map((c) => [c.ID, c]));

    const weekdays = winnerIds.map((id) => {
      const category = id ? categoryMap.get(id) : null;
      return { name: category?.name ?? null, color: category?.color ?? null };
    });

    return { weekdays };
  }

  /**
   * The single biggest one-off (non-exceptional) expense of a year (COS-46).
   * Reads the `Spendings` table only, so recurrings and exceptionals — which live
   * in their own tables — are excluded by construction; no itemType filter needed.
   * Amounts are stored positive, so the max-amount row is the biggest expense.
   * Uses the same half-open UTC range as the daily stats. Returns a null expense
   * when the user has no spending that year. Backs the "courante" row of the
   * "Plus grosse dépense" KPI card.
   */
  async getBiggestRegularExpense(yearStr: string, userID: string): Promise<BiggestRegularExpenseResponse> {
    const year = parseInt(yearStr, 10);
    if (Number.isNaN(year)) {
      return { expense: null };
    }

    const yearStart = new Date(Date.UTC(year, 0, 1));
    const nextYearStart = new Date(Date.UTC(year + 1, 0, 1));

    const row = await this.prisma.spendings.findFirst({
      where: { userID, date: { gte: yearStart, lt: nextYearStart } },
      orderBy: { amount: "desc" },
      include: { category: true },
    });
    if (!row) {
      return { expense: null };
    }

    return {
      expense: {
        label: row.label,
        amount: round2(Number(row.amount)),
        date: row.date.toISOString().slice(0, 10),
        categoryName: row.category?.name ?? null,
        categoryColor: row.category?.color ?? null,
      },
    };
  }

  /**
   * Per-category spending totals for two windows — the current period and the
   * one it is compared against — so the front can show a per-category trend
   * (month-over-month for the dashboard, COS-41; week-over-week for Dépenses,
   * COS-35). Reads the one-off `Spendings` table only, so recurrings and
   * exceptionals — which live in their own tables — are excluded by construction.
   * Groups each window by category with a single `groupBy`, resolves names/colours
   * for the current window, and returns one row per category present in the
   * CURRENT window, sorted by current amount desc (matching the breakdown
   * bar/list order). `previousValue` is null when the category had no spending in
   * the comparison window ("nouv."). Also returns `previousTotal` — the whole
   * comparison window's spending across every category — which the Dépenses page
   * turns into the "moyenne / jour vs sem. dernière" delta (COS-35). Amounts are
   * rounded to the cent; the delta % is derived on the front.
   */
  async getCategoryTrends(
    userID: string,
    from: string,
    to: string,
    prevFrom: string,
    prevTo: string,
  ): Promise<CategoryTrendsResponse> {
    const currentWindow = this.dateWindow(from, to);
    const previousWindow = this.dateWindow(prevFrom, prevTo);

    const [current, previous] = await Promise.all([
      this.prisma.spendings.groupBy({
        by: ["categoryID"],
        where: { userID, ...(currentWindow ? { date: currentWindow } : {}) },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
      }),
      this.prisma.spendings.groupBy({
        by: ["categoryID"],
        where: { userID, ...(previousWindow ? { date: previousWindow } : {}) },
        _sum: { amount: true },
      }),
    ]);

    // Keyed by categoryID (null = uncategorized), so a current category absent
    // here stays null ("nouv.") rather than being read as a real 0.
    const previousByCategory = new Map<string | null, number>();
    for (const group of previous) {
      previousByCategory.set(group.categoryID, round2(Number(group._sum.amount ?? 0)));
    }

    // Comparison-window total across every category — summed from the full
    // `previous` groupBy (not from `trends`, which drops categories absent this
    // week) so the avg/day delta is not undercounted.
    const previousTotal = round2(previous.reduce((sum, group) => sum + Number(group._sum.amount ?? 0), 0));

    const categoryIDs = current.map((g) => g.categoryID).filter((id): id is string => id !== null);
    const categories =
      categoryIDs.length > 0
        ? await this.prisma.categories.findMany({
            where: { ID: { in: categoryIDs }, OR: [{ userID }, { userID: null }] },
            select: { ID: true, name: true, color: true },
          })
        : [];
    const categoryMap = new Map(categories.map((c) => [c.ID, c]));

    const trends: CategoryTrendPoint[] = current.map((group) => {
      const category = group.categoryID ? categoryMap.get(group.categoryID) : null;
      return {
        category: category?.name ?? null,
        categoryColor: category?.color ?? null,
        value: round2(Number(group._sum.amount ?? 0)),
        previousValue: previousByCategory.has(group.categoryID)
          ? (previousByCategory.get(group.categoryID) ?? null)
          : null,
      };
    });

    return { trends, previousTotal };
  }

  async getStatistics(categoryIDs: string[], years: string[], userID: string): Promise<StatisticsResponse> {
    const yearNumbers = years.map((y) => parseInt(y, 10));
    const startDate = new Date(Math.min(...yearNumbers), 0, 1);
    const endDate = new Date(Math.max(...yearNumbers), 11, 31);

    const userCategories = await this.prisma.categories.findMany({
      where: { ID: { in: categoryIDs }, OR: [{ userID }, { userID: null }] },
      select: { ID: true, name: true, color: true },
    });
    const allowedCategoryIds = new Set(userCategories.map((c) => c.ID));
    const filteredCategoryIDs = categoryIDs.filter((id) => allowedCategoryIds.has(id));
    if (filteredCategoryIDs.length === 0) {
      return { colors: {}, data: {} };
    }

    const spendings = await this.prisma.spendings.findMany({
      where: {
        userID,
        categoryID: { in: filteredCategoryIDs },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
    });

    const output: StatisticsResponse = { colors: {}, data: {} };
    const categoryTemplate: Record<string, number> = {};

    for (const cat of userCategories) {
      const categoryName = cat.name.toLowerCase();
      output.colors[categoryName] = cat.color;
      categoryTemplate[categoryName] = 0;
    }

    const monthTotals: Map<string, { year: number; month: string; totals: Record<string, number> }> = new Map();
    const monthOrder = [
      "janv.",
      "févr.",
      "mars",
      "avr.",
      "mai",
      "juin",
      "juil.",
      "août",
      "sept.",
      "oct.",
      "nov.",
      "déc.",
    ];

    for (const row of spendings) {
      if (!row.category || !yearNumbers.includes(getYear(row.date))) continue;
      const date = row.date;
      const year = getYear(date);
      const monthKey = format(date, "yyyy-MM");
      const monthLabel = format(parse(monthKey, "yyyy-MM", new Date()), "MMM", { locale: fr });
      const categoryName = row.category.name.toLowerCase();

      const key = `${year}-${monthLabel}`;
      if (!monthTotals.has(key)) {
        monthTotals.set(key, {
          year,
          month: monthLabel,
          totals: { ...categoryTemplate },
        });
      }
      const entry = monthTotals.get(key)!;
      const amount = Number(row.amount.toString());
      entry.totals[categoryName] = (entry.totals[categoryName] ?? 0) + amount;
    }

    const sortedKeys = Array.from(monthTotals.keys()).sort((a, b) => {
      const [yearA, monthA] = a.split("-");
      const [yearB, monthB] = b.split("-");
      if (yearA !== yearB) return parseInt(yearA, 10) - parseInt(yearB, 10);
      return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
    });

    for (const key of sortedKeys) {
      const entry = monthTotals.get(key)!;
      const yearStr = String(entry.year);
      if (!output.data[yearStr]) {
        output.data[yearStr] = [];
      }
      const roundedTotals = Object.fromEntries(Object.entries(entry.totals).map(([k, v]) => [k, roundCurrency(v)]));
      output.data[yearStr].push({
        month: entry.month,
        ...roundedTotals,
      });
    }

    return output;
  }

  /**
   * Time distribution of the spendings matching a search term (COS-160) — the
   * aggregate behind the Statistics search-timeline widget. Matching reuses the
   * whole-history search clause (label OR accessible category name, LIKE
   * metacharacters escaped — see @spendings/search-where.helper) so the widget
   * and the Dashboard search never disagree for the same term. `Spendings`
   * table only (recurrings/exceptionals live in their own tables), scoped to
   * the user, over an inclusive [from, to] calendar window.
   *
   * Buckets by UTC day, or by calendar week keyed on its Sunday (weeks run
   * Sun→Sat across the app). Prisma's groupBy can't group on a truncated date,
   * so this selects {date, amount} and aggregates in memory — fine at
   * single-user volumes ($queryRaw with DATE()/YEARWEEK stays the fallback if
   * it ever gets heavy). Only non-empty buckets are returned; the front fills
   * the gaps.
   */
  async getSearchTimeline(
    query: string,
    from: string,
    to: string,
    bucket: "day" | "week",
    userID: string,
  ): Promise<SearchTimelineResponse> {
    const emptySummary = { total: 0, count: 0, firstDate: null, lastDate: null };
    const q = query.trim();
    if (q.length < MIN_SEARCH_LENGTH) {
      return { buckets: [], summary: emptySummary };
    }

    // Inclusive [from, to] window as a half-open UTC range (`to` pushed to the
    // next UTC day), like the category-stats window.
    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toExclusive = new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000);

    const rows = await this.prisma.spendings.findMany({
      where: {
        userID,
        ...spendingSearchTextWhere(escapeLikeQuery(q)),
        date: { gte: fromDate, lt: toExclusive },
      },
      select: { date: true, amount: true },
    });

    // A week bucket is keyed by the UTC date of its Sunday.
    const bucketKey = (date: Date): string => {
      if (bucket === "day") {
        return date.toISOString().slice(0, 10);
      }
      const sunday = new Date(date.getTime());
      sunday.setUTCHours(0, 0, 0, 0);
      sunday.setUTCDate(sunday.getUTCDate() - sunday.getUTCDay());
      return sunday.toISOString().slice(0, 10);
    };

    const byBucket = new Map<string, { total: number; count: number }>();
    let total = 0;
    let firstDate: string | null = null;
    let lastDate: string | null = null;
    for (const row of rows) {
      const key = bucketKey(row.date);
      const entry = byBucket.get(key) ?? { total: 0, count: 0 };
      entry.total += Number(row.amount);
      entry.count += 1;
      byBucket.set(key, entry);

      total += Number(row.amount);
      const day = row.date.toISOString().slice(0, 10);
      if (firstDate === null || day < firstDate) firstDate = day;
      if (lastDate === null || day > lastDate) lastDate = day;
    }

    const buckets: SearchTimelineBucket[] = Array.from(byBucket.entries())
      .map(([date, entry]) => ({ date, total: round2(entry.total), count: entry.count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      buckets,
      summary: { total: round2(total), count: rows.length, firstDate, lastDate },
    };
  }
}
