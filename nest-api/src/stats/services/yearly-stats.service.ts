import { Injectable } from "@nestjs/common";
import { format, getYear, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { escapeLikeQuery, MIN_SEARCH_LENGTH, spendingSearchTextWhere } from "@spendings/search-where.helper";
import { round2, roundCurrency } from "@stats/helpers/rounding.helper";
import { PrismaService } from "../../prisma/prisma.service";

import type { SearchTimelineQueryDto } from "@stats/dto/search-timeline-query.dto";
import type { StatisticsResponse } from "@stats/dto/statistics-response.interface";
import type { DailyStat, DailyStatsResponse } from "@stats/dto/daily-stats-response.interface";
import type { BiggestRegularExpenseResponse } from "@stats/dto/biggest-regular-expense-response.interface";
import type { WeekdayCategoriesResponse, WeekdayCategory } from "@stats/dto/weekday-categories-response.interface";
import type { SearchTimelineBucket, SearchTimelineResponse } from "@stats/dto/search-timeline-response.interface";

/** Stats behind the Statistiques page. */
@Injectable()
export class YearlyStatsService {
  constructor(private readonly prisma: PrismaService) {}

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
  async getSearchTimeline(search: SearchTimelineQueryDto, userID: string): Promise<SearchTimelineResponse> {
    const { from, to, bucket } = search;
    const emptySummary = { total: 0, count: 0, firstDate: null, lastDate: null };
    const q = search.q.trim();
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
