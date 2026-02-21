import { Injectable } from "@nestjs/common";
import { endOfMonth, format, getDay, getDaysInMonth, getMonth, getYear, parse, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { PrismaService } from "../prisma/prisma.service";

import type { StatisticsResponse } from "@stats/dto/statistics-response.interface";

/** Rounds to 2 decimal places to avoid JS float precision issues. */
const roundCurrency = (n: number): number => Math.round(n);

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
      const roundedTotals = Object.fromEntries(
        Object.entries(entry.totals).map(([k, v]) => [k, roundCurrency(v)]),
      );
      output.data[yearStr].push({
        month: entry.month,
        ...roundedTotals,
      });
    }

    return output;
  }
}
