import { Injectable } from "@nestjs/common";
import { endOfMonth, format, getDay, getDaysInMonth, getMonth, getYear, parse, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { PrismaService } from "../prisma/prisma.service";

import type { StatisticsResponse } from "@stats/dto/statistics-response.interface";
import type { CategoryStat, CategoryStatsResponse } from "@stats/dto/category-stats-response.interface";
import type { DailyStat, DailyStatsResponse } from "@stats/dto/daily-stats-response.interface";
import type { BiggestRegularExpenseResponse } from "@stats/dto/biggest-regular-expense-response.interface";

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
   * All-time usage aggregate per category: number of spendings and total amount
   * spent, grouped by category over the user's whole history (no date filter).
   * `totalSpent` sums every spending (incl. uncategorized) so the front can derive
   * each category's share of total spending.
   */
  async getCategoryStats(userID: string): Promise<CategoryStatsResponse> {
    const grouped = await this.prisma.spendings.groupBy({
      by: ["categoryID"],
      where: { userID },
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
}
