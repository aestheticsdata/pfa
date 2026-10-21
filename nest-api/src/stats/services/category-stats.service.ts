import { Injectable } from "@nestjs/common";
import type { CategoryStat, CategoryStatsResponse } from "@stats/dto/category-stats-response.interface";
import { dateWindow } from "@stats/helpers/date-window.helper";
import { PrismaService } from "../../prisma/prisma.service";

/** Stats behind the Catégories and Exceptionnels pages. */
@Injectable()
export class CategoryStatsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Usage aggregate per category: number of spendings and total amount spent,
   * grouped by category. With no date bounds it covers the user's whole history
   * (Categories page); with `from`/`to` it scopes to that window — the spending
   * modal passes the current year to date so its "Fréquentes" quick-picks rank
   * on recent usage (COS-137). `totalSpent` sums every spending in scope (incl.
   * uncategorized) so the front can derive each category's share.
   */
  async getCategoryStats(userID: string, from?: string, to?: string): Promise<CategoryStatsResponse> {
    const date = dateWindow(from, to);
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
}
