import { randomUUID } from "node:crypto";
import { accessibleCategory, JOINED_CATEGORY_SELECT } from "@categories/accessible-category";
import { resolveCategoryID } from "@categories/category-resolver";
import { Injectable, NotFoundException } from "@nestjs/common";
import type { RecurringItem } from "@recurrings/interfaces/recurringItemTypes";
import type { SpendingCategoryInput } from "@spendings/dto/spending-category-input.interface";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RecurringsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecurrings(start: string, userID: string): Promise<RecurringItem[]> {
    const results = await this.prisma.recurrings.findMany({
      where: {
        userID,
        dateFrom: new Date(start),
      },
      orderBy: { amount: "desc" },
      // Listed, never spread: a new column stays out of the response until asked for (PFA-257).
      select: {
        ID: true,
        dateFrom: true,
        dateTo: true,
        itemType: true,
        label: true,
        amount: true,
        currency: true,
        invoicefile: true,
        categoryID: true,
        category: JOINED_CATEGORY_SELECT,
      },
    });

    // Flattened to name/colour exactly like getSpendings (PFA-38).
    return results.map(({ category, ...recurring }) => ({ ...recurring, ...accessibleCategory(category, userID) }));
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
    dto: {
      start: string;
      end: string;
      label: string;
      amount: number;
      currency?: string;
      category?: SpendingCategoryInput;
    },
    userID: string,
  ): Promise<{ message: string }> {
    const categoryID = await resolveCategoryID(this.prisma, dto.category, userID);
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
        categoryID,
        itemType: "recurring",
      },
    });
    return { message: "new recurring added" };
  }

  async updateRecurring(
    id: string,
    userID: string,
    dto: { label: string; amount: number; category?: SpendingCategoryInput },
  ): Promise<{ success: boolean }> {
    const categoryID = await resolveCategoryID(this.prisma, dto.category, userID);
    const updated = await this.prisma.recurrings.updateMany({
      where: { ID: id, userID },
      data: { label: dto.label, amount: dto.amount, categoryID },
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
        categoryID: true,
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
        categoryID: r.categoryID,
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
