import { Injectable } from "@nestjs/common";
import type { BusiestWeekResponse } from "@stats/dto/busiest-week-response.interface";
import type { CategoryTrendsQueryDto } from "@stats/dto/category-trends-query.dto";
import type { CategoryTrendPoint, CategoryTrendsResponse } from "@stats/dto/category-trends-response.interface";
import type { MonthlyStatsResponse } from "@stats/dto/monthly-stats-response.interface";
import type { SpendingPaceResponse } from "@stats/dto/spending-pace-response.interface";
import { dateWindow } from "@stats/helpers/date-window.helper";
import { round2 } from "@stats/helpers/rounding.helper";
import { makeRange, weekRangesOfMonth } from "@stats/helpers/week-ranges.helper";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { PrismaService } from "../../prisma/prisma.service";

/** Stats behind the Dépenses and Dashboard pages. */
@Injectable()
export class SpendingsStatsService {
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

    return makeRange(spendings, startDate);
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

    const ranges = weekRangesOfMonth(year, month);
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

  async getMonthlyStats(from: string, userID: string): Promise<MonthlyStatsResponse> {
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

    return {
      spendingsSum: round2(Number(spendingsResult._sum.amount ?? 0)),
      recurringsSum: round2(Number(recurringsResult._sum.amount ?? 0)),
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
  async getCategoryTrends(userID: string, windows: CategoryTrendsQueryDto): Promise<CategoryTrendsResponse> {
    const currentWindow = dateWindow(windows.from, windows.to);
    const previousWindow = dateWindow(windows.prevFrom, windows.prevTo);

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
}
