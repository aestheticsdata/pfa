import type { CategoryDailyTotals, DailyProjection } from "@contexts/analytics/domain/interfaces/analyticsTypes";
import { dailyBuckets, NO_PROJECTION, projectionCandidates } from "@contexts/analytics/domain/projection";
import type { MonthlyIncomeResponse } from "@contexts/analytics/interface/dto/monthly-income-response.interface";
import { PrismaService } from "@db/prisma.service";
import { Injectable } from "@nestjs/common";
import { CalendarMonth } from "@shared-kernel/calendar-month";

@Injectable()
export class DashboardQueries {
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
    if (Number.isNaN(base.getTime())) return NO_PROJECTION;

    for (const candidate of projectionCandidates(CalendarMonth.containing(base))) {
      const rows = await this.prisma.spendings.findMany({
        where: { userID, date: { gte: candidate.month.start(), lt: candidate.month.end() } },
        select: { date: true, amount: true, categoryID: true },
      });
      if (rows.length === 0) continue;

      const buckets = dailyBuckets(
        rows.map((row) => ({ date: row.date, amount: Number(row.amount), categoryId: row.categoryID })),
        candidate.month,
      );
      return {
        source: candidate.source,
        referenceMonth: candidate.month.firstDayIso(),
        dailyTotals: buckets.dailyTotals,
        byCategory: await this.namedCategoryTotals(buckets.byCategoryId, userID, candidate.month.daysIn()),
      };
    }

    return NO_PROJECTION;
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
}
