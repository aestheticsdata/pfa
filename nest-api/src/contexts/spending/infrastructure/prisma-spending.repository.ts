import { SpendingRepository } from "@contexts/spending/domain/ports/spending.repository";
import { Spending } from "@contexts/spending/domain/spending";
import {
  currencyColumn,
  SPENDING_ITEM_TYPE,
  toDay,
  toMoney,
} from "@contexts/spending/infrastructure/spending-persistence";
import { PrismaService } from "@db/prisma.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PrismaSpendingRepository extends SpendingRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async byId(id: string, ownerId: string): Promise<Spending | null> {
    const row = await this.prisma.spendings.findFirst({
      where: { ID: id, userID: ownerId },
      select: {
        date: true,
        label: true,
        amount: true,
        currency: true,
        categoryID: true,
        invoicefile: true,
        groupID: true,
      },
    });
    if (!row) return null;
    return Spending.restore({
      id,
      ownerId,
      date: toDay(row.date),
      label: row.label,
      amount: toMoney(row.amount, row.currency),
      categoryId: row.categoryID,
      receipt: row.invoicefile,
      groupId: row.groupID,
    });
  }

  async add(spending: Spending): Promise<void> {
    const state = spending.snapshot();
    await this.prisma.spendings.create({
      data: {
        ID: state.id,
        userID: state.ownerId,
        date: state.date.toDate(),
        label: state.label,
        amount: state.amount.toDecimalString(),
        categoryID: state.categoryId,
        currency: currencyColumn(state.amount),
        itemType: SPENDING_ITEM_TYPE,
      },
    });
  }

  async save(spending: Spending): Promise<void> {
    const state = spending.snapshot();
    await this.prisma.spendings.updateMany({
      where: { ID: state.id, userID: state.ownerId },
      data: { label: state.label, amount: state.amount.toDecimalString(), categoryID: state.categoryId },
    });
  }

  async remove(spending: Spending): Promise<void> {
    const { id, ownerId, groupId } = spending.snapshot();
    await this.prisma.$transaction([
      this.prisma.spendings.deleteMany({ where: { ID: id, userID: ownerId } }),
      // A group never outlives its last line.
      ...(groupId
        ? [this.prisma.spendingGroups.deleteMany({ where: { ID: groupId, userID: ownerId, spendings: { none: {} } } })]
        : []),
    ]);
  }
}
