import { randomUUID } from "node:crypto";
import { accessibleCategory, JOINED_CATEGORY_SELECT } from "@contexts/budget-planning/domain/accessible-category";
import type {
  DayRange,
  MonthSpan,
  OwnedRecord,
  RecurringCharge,
  RecurringEdit,
  RecurringItem,
} from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";
import { RecurringRepository } from "@contexts/budget-planning/domain/ports/recurring.repository";
import { PrismaService } from "@db/prisma.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PrismaRecurringRepository extends RecurringRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async month(start: Date, ownerId: string): Promise<RecurringItem[]> {
    const results = await this.prisma.recurrings.findMany({
      where: { userID: ownerId, dateFrom: start },
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
    // Flattened to name/colour exactly like the spendings (PFA-38).
    return results.map(({ category, amount, ...recurring }) => ({
      ...recurring,
      // The Decimal as the text it serialises to: the response is unchanged.
      amount: amount.toString(),
      ...accessibleCategory(category, ownerId),
    }));
  }

  async chargesOf(start: Date, ownerId: string): Promise<RecurringCharge[]> {
    const rows = await this.prisma.recurrings.findMany({
      where: { userID: ownerId, dateFrom: start },
      select: { label: true, amount: true, itemType: true, currency: true, categoryID: true },
    });
    return rows.map((row) => ({
      label: row.label,
      amount: row.amount.toString(),
      itemType: row.itemType,
      currency: row.currency,
      categoryId: row.categoryID,
    }));
  }

  async total(range: DayRange, ownerId: string): Promise<number> {
    const result = await this.prisma.recurrings.aggregate({
      _sum: { amount: true },
      where: { userID: ownerId, dateFrom: { gte: range.from, lt: range.until } },
    });
    return Number(result._sum.amount ?? 0);
  }

  async add(charges: (RecurringCharge & MonthSpan)[], ownerId: string): Promise<void> {
    await this.prisma.recurrings.createMany({
      data: charges.map((charge) => ({
        ID: randomUUID(),
        userID: ownerId,
        dateFrom: charge.start,
        dateTo: charge.end,
        label: charge.label,
        amount: charge.amount,
        currency: charge.currency,
        categoryID: charge.categoryId,
        itemType: charge.itemType,
      })),
    });
  }

  async edit(recurring: OwnedRecord, edit: RecurringEdit): Promise<boolean> {
    const updated = await this.prisma.recurrings.updateMany({
      where: { ID: recurring.id, userID: recurring.ownerId },
      data: { label: edit.label, amount: edit.amount, categoryID: edit.categoryId },
    });
    return updated.count > 0;
  }

  async remove(recurring: OwnedRecord): Promise<boolean> {
    const deleted = await this.prisma.recurrings.deleteMany({ where: { ID: recurring.id, userID: recurring.ownerId } });
    return deleted.count > 0;
  }
}
