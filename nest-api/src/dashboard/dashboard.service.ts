import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

import type { MonthlyIncomeResponse } from "@dashboard/dto/monthly-income-response.interface";

// Which historical period the sparkline projection is based on (COS-27). Follows
// the GLOBAL projection chain; "none" is the very-first-month case (no reference
// exists yet — the front shows no projection tail, never an average fallback).
export type ProjectionSource = "sameMonthLastYear" | "sameMonthTwoYearsAgo" | "previousMonth" | "none";

/** One category's slice of the reference month, day by day (PFA-181). */
export interface CategoryDailyTotals {
  /** Category name; null = uncategorized. */
  category: string | null;
  /** Category colour; null = uncategorized/fallback. */
  categoryColor: string | null;
  /** The category's day-by-day totals in the reference month; index i = day (i+1). */
  dailyTotals: number[];
}

export interface DailyProjection {
  source: ProjectionSource;
  /** ISO date (YYYY-MM-DD) of the reference month's first day, or null when source is "none". */
  referenceMonth: string | null;
  /** Day-by-day spending totals of the reference month; index i = day (i+1). */
  dailyTotals: number[];
  /**
   * The same reference month, sliced per category (PFA-181). The chain above is
   * resolved ONCE, globally; this only cuts its result up, so every category is
   * projected from the same month and the slices always add back up to
   * `dailyTotals`. Empty whenever `dailyTotals` is.
   */
  byCategory: CategoryDailyTotals[];
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Day-by-day totals of the reference period used to project the (in-progress)
   * month's sparkline tail (COS-27). Resolves the reference month by walking the
   * GLOBAL projection chain, stopping at the first month the user has any
   * spending in:
   *   1. same month, previous year   (N-1)
   *   2. same month, two years ago   (N-2)
   *   3. previous calendar month     (M-1)
   *   4. none of the above → "none"  (the user's very first month of data)
   *
   * `start` must be a clean ISO date (YYYY-MM-DD) for the viewed month's first
   * day so the UTC month arithmetic below is timezone-safe.
   */
  async getDailyProjection(start: string, userID: string): Promise<DailyProjection> {
    const base = new Date(start);
    if (Number.isNaN(base.getTime())) {
      return { source: "none", referenceMonth: null, dailyTotals: [], byCategory: [] };
    }

    const year = base.getUTCFullYear();
    const month = base.getUTCMonth();

    const candidates: { source: ProjectionSource; year: number; month: number }[] = [
      { source: "sameMonthLastYear", year: year - 1, month },
      { source: "sameMonthTwoYearsAgo", year: year - 2, month },
      // Previous calendar month, wrapping January → previous December.
      { source: "previousMonth", year: month === 0 ? year - 1 : year, month: (month + 11) % 12 },
    ];

    for (const candidate of candidates) {
      const monthStart = new Date(Date.UTC(candidate.year, candidate.month, 1));
      const nextMonthStart = new Date(Date.UTC(candidate.year, candidate.month + 1, 1));

      const rows = await this.prisma.spendings.findMany({
        where: { userID, date: { gte: monthStart, lt: nextMonthStart } },
        select: { date: true, amount: true, categoryID: true },
      });

      if (rows.length === 0) continue;

      // Day 0 of the next month == last day of this month → number of days.
      const daysInMonth = new Date(Date.UTC(candidate.year, candidate.month + 1, 0)).getUTCDate();
      const dailyTotals = new Array<number>(daysInMonth).fill(0);
      // Same pass, bucketed twice: the month as a whole and each category's
      // share of it, so the two can never tell different stories (PFA-181).
      const byCategoryID = new Map<string | null, number[]>();
      for (const rowItem of rows) {
        const day = rowItem.date.getUTCDate();
        if (day < 1 || day > daysInMonth) continue;
        const amount = Number(rowItem.amount);
        dailyTotals[day - 1] += amount;
        let categoryDaily = byCategoryID.get(rowItem.categoryID);
        if (!categoryDaily) {
          categoryDaily = new Array<number>(daysInMonth).fill(0);
          byCategoryID.set(rowItem.categoryID, categoryDaily);
        }
        categoryDaily[day - 1] += amount;
      }

      return {
        source: candidate.source,
        referenceMonth: monthStart.toISOString().slice(0, 10),
        dailyTotals,
        byCategory: await this.namedCategoryTotals(byCategoryID, userID, daysInMonth),
      };
    }

    return { source: "none", referenceMonth: null, dailyTotals: [], byCategory: [] };
  }

  /**
   * Turns the reference month's per-category-ID buckets into named rows (PFA-181).
   *
   * Merged by NAME, not by ID: a user category and a global one can share a
   * name, and the front already merges those two rows into one
   * (`aggregateByCategory`). Keying by ID here would hand the breakdown a
   * projection it cannot line up with any of its rows. A category the user can
   * no longer read falls back to uncategorized, exactly as the category trends
   * do, so no spending is ever dropped on the way.
   */
  private async namedCategoryTotals(
    byCategoryID: Map<string | null, number[]>,
    userID: string,
    daysInMonth: number,
  ): Promise<CategoryDailyTotals[]> {
    const categoryIDs = [...byCategoryID.keys()].filter((id): id is string => id !== null);
    const categories =
      categoryIDs.length > 0
        ? await this.prisma.categories.findMany({
            where: { ID: { in: categoryIDs }, OR: [{ userID }, { userID: null }] },
            select: { ID: true, name: true, color: true },
          })
        : [];
    const categoryMap = new Map(categories.map((category) => [category.ID, category]));

    const byName = new Map<string | null, CategoryDailyTotals>();
    for (const [categoryID, categoryDaily] of byCategoryID) {
      const category = categoryID ? categoryMap.get(categoryID) : null;
      const name = category?.name ?? null;
      const existing = byName.get(name);
      if (!existing) {
        byName.set(name, { category: name, categoryColor: category?.color ?? null, dailyTotals: categoryDaily });
        continue;
      }
      for (let day = 0; day < daysInMonth; day += 1) {
        existing.dailyTotals[day] += categoryDaily[day];
      }
      existing.categoryColor ??= category?.color ?? null;
    }

    // Heaviest first, mirroring the breakdown's own ordering.
    const monthTotal = (daily: number[]) => daily.reduce((accumulator, value) => accumulator + value, 0);
    return [...byName.values()].sort((a, b) => monthTotal(b.dailyTotals) - monthTotal(a.dailyTotals));
  }

  /**
   * Per-month income (dashboard initialAmount) for a year (COS-50). Reads the
   * per-month `Dashboards` rows and returns a 12-slot array (Jan→Dec); a month
   * with no dashboard row comes back null. Uses a half-open UTC range like the
   * daily stats so the month bucketing is timezone-safe. Backs the monthly
   * chart's stepped budget line — the front carries the last known value forward
   * over the null gaps.
   */
  async getMonthlyIncome(yearStr: string, userID: string): Promise<MonthlyIncomeResponse> {
    const year = parseInt(yearStr, 10);
    if (Number.isNaN(year)) {
      return { income: Array<number | null>(12).fill(null) };
    }

    const yearStart = new Date(Date.UTC(year, 0, 1));
    const nextYearStart = new Date(Date.UTC(year + 1, 0, 1));

    const rows = await this.prisma.dashboards.findMany({
      where: { userID, dateFrom: { gte: yearStart, lt: nextYearStart } },
      select: { dateFrom: true, initialAmount: true },
    });

    const income = Array<number | null>(12).fill(null);
    for (const row of rows) {
      const month = row.dateFrom.getUTCMonth();
      if (month >= 0 && month < 12) income[month] = Number(row.initialAmount);
    }

    return { income };
  }

  async getDashboard(start: string, userID: string) {
    const dashboard = await this.prisma.dashboards.findFirst({
      where: {
        userID,
        dateFrom: new Date(start),
      },
    });

    if (!dashboard) {
      return null;
    }

    return {
      ...dashboard,
      initialAmount: Number(dashboard.initialAmount),
      initialCeiling: dashboard.initialCeiling ? Number(dashboard.initialCeiling) : null,
    };
  }

  async createDashboard(dto: { start: string; end: string; amount: number }, userID: string) {
    const id = randomUUID();
    await this.prisma.dashboards.create({
      data: {
        ID: id,
        dateFrom: new Date(dto.start),
        dateTo: new Date(dto.end),
        initialAmount: dto.amount,
        userID,
      },
    });
    return { insertId: id, ID: id };
  }

  async updateDashboard(id: string, userID: string, dto: { amount?: number; ceiling?: number }) {
    const existing = await this.prisma.dashboards.findFirst({
      where: { ID: id, userID },
    });

    if (!existing) {
      throw new NotFoundException("Dashboard not found");
    }

    const data: { initialAmount?: number; initialCeiling?: number } = {};
    if (dto.amount !== undefined && dto.amount !== null) {
      data.initialAmount = dto.amount;
    }
    if (dto.ceiling !== undefined && dto.ceiling !== null) {
      data.initialCeiling = dto.ceiling;
    }

    if (Object.keys(data).length === 0) {
      return existing;
    }

    return this.prisma.dashboards.update({
      where: { ID: id },
      data,
    });
  }
}
