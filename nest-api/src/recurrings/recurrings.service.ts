import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RecurringsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecurrings(start: string, userID: string) {
    return this.prisma.recurrings.findMany({
      where: {
        userID,
        dateFrom: new Date(start),
      },
      orderBy: { amount: "desc" },
    });
  }

  /**
   * Real year-to-date "déjà prélevé" (COS-49): the sum of the actual per-month
   * recurring rows from January through the client's current month (inclusive).
   * Recurrings are stored one row per month (copied forward), so this reflects
   * what was really committed each month — no calendar estimate, no `dateFrom`
   * charge-day proxy. A half-open UTC range keeps the month bound timezone-safe.
   */
  async getDrawn(yearStr: string, monthStr: string, userID: string): Promise<{ drawn: number }> {
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (Number.isNaN(year) || Number.isNaN(month) || month < 0 || month > 11) {
      return { drawn: 0 };
    }

    const yearStart = new Date(Date.UTC(year, 0, 1));
    const throughMonthEnd = new Date(Date.UTC(year, month + 1, 1));

    const result = await this.prisma.recurrings.aggregate({
      _sum: { amount: true },
      where: { userID, dateFrom: { gte: yearStart, lt: throughMonthEnd } },
    });

    return { drawn: Number(result._sum.amount ?? 0) };
  }

  async createRecurring(
    dto: { start: string; end: string; label: string; amount: number; currency?: string },
    userID: string,
  ): Promise<{ message: string }> {
    const id = randomUUID();
    await this.prisma.recurrings.create({
      data: {
        ID: id,
        userID,
        dateFrom: new Date(dto.start),
        dateTo: new Date(dto.end),
        label: dto.label,
        amount: dto.amount,
        currency: dto.currency ?? null,
        itemType: "recurring",
      },
    });
    return { message: "new recurring added" };
  }

  async updateRecurring(
    id: string,
    userID: string,
    dto: { label: string; amount: number },
  ): Promise<{ success: boolean }> {
    const updated = await this.prisma.recurrings.updateMany({
      where: { ID: id, userID },
      data: { label: dto.label, amount: dto.amount },
    });

    if (updated.count === 0) {
      throw new NotFoundException("Recurring not found");
    }

    return { success: true };
  }

  async copyRecurrings(
    userID: string,
    dates: { start: string; end: string; previousMonthStart: string },
  ): Promise<{ msg: string }> {
    const previousRecurrings = await this.prisma.recurrings.findMany({
      where: {
        userID,
        dateFrom: new Date(dates.previousMonthStart),
      },
      select: {
        label: true,
        amount: true,
        itemType: true,
        currency: true,
      },
    });

    if (previousRecurrings.length === 0) {
      return { msg: "recurrings copied" };
    }

    await this.prisma.recurrings.createMany({
      data: previousRecurrings.map((r) => ({
        ID: randomUUID(),
        userID,
        dateFrom: new Date(dates.start),
        dateTo: new Date(dates.end),
        label: r.label,
        amount: r.amount,
        currency: r.currency,
        itemType: r.itemType,
      })),
    });

    return { msg: "recurrings copied" };
  }

  async deleteRecurring(id: string, userID: string): Promise<{ success: boolean }> {
    const deleted = await this.prisma.recurrings.deleteMany({
      where: { ID: id, userID },
    });

    if (deleted.count === 0) {
      throw new NotFoundException("Recurring not found");
    }

    return { success: true };
  }
}
