import { Injectable } from "@nestjs/common";
import {
  endOfMonth,
  format,
  getDay,
  getDaysInMonth,
  getMonth,
  getYear,
  startOfMonth,
} from "date-fns";
import { PrismaService } from "../prisma/prisma.service";

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

  private makeRange(
    monthSpending: { date: Date; amount: { toString: () => string } }[],
    startDate: Date,
  ): number[] {
    const ranges: number[] = [];
    const dayNumberFromMonthStart = getDay(startDate);
    const firstSlice = 7 - dayNumberFromMonthStart;
    const numberOfDaysInMonth = getDaysInMonth(startDate);
    ranges.push(firstSlice);
    const numberOfFullWeeks = Math.floor((numberOfDaysInMonth - firstSlice) / 7);
    for (let i = 0; i < numberOfFullWeeks; i += 1) {
      ranges.push(7);
    }
    const remainingNumberOfDays =
      numberOfDaysInMonth - (firstSlice + 7 * numberOfFullWeeks);
    if (remainingNumberOfDays !== 0) {
      ranges.push(remainingNumberOfDays);
    }

    const totalsByWeek: number[] = [];
    let dayShifter = 0;
    for (let slice_i = 0; slice_i < ranges.length; slice_i += 1) {
      totalsByWeek[slice_i] = 0;
      let tempTotal = 0;
      for (let day_of_slice_i = 0; day_of_slice_i < ranges[slice_i]; day_of_slice_i += 1) {
        const targetDate = new Date(
          getYear(startDate),
          getMonth(startDate),
          day_of_slice_i + 1 + dayShifter,
        );
        const targetStr = format(targetDate, "yyyy-MM-dd");
        const spendingByDay = monthSpending.filter(
          (o) => format(o.date, "yyyy-MM-dd") === targetStr,
        );
        tempTotal = spendingByDay.reduce(
          (acc, curr) => acc + Number(curr.amount.toString()),
          0,
        );
        if (spendingByDay.length !== 0) {
          totalsByWeek[slice_i] += tempTotal;
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
}
