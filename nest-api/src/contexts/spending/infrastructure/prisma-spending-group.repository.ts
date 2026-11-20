import type { GroupCandidate } from "@contexts/spending/domain/interfaces/spendingTypes";
import { SpendingGroupRepository } from "@contexts/spending/domain/ports/spending-group.repository";
import { SpendingGroup } from "@contexts/spending/domain/spending-group";
import {
  currencyColumn,
  SPENDING_ITEM_TYPE,
  toDay,
  toMoney,
} from "@contexts/spending/infrastructure/spending-persistence";
import { PrismaService } from "@db/prisma.service";
import { Injectable } from "@nestjs/common";

const LINE_SELECT = {
  ID: true,
  amount: true,
  currency: true,
  categoryID: true,
  detail: true,
  invoicefile: true,
} as const;

/**
 * Groups and their lines in MySQL (PFA-273). A line is an ordinary `Spendings` row carrying
 * `groupID`, so every total, breakdown and search keeps counting it in its own category; its
 * `label` column holds the composed "<group> — <detail>" for the same readers.
 */
@Injectable()
export class PrismaSpendingGroupRepository extends SpendingGroupRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async byId(id: string, ownerId: string): Promise<SpendingGroup | null> {
    const row = await this.prisma.spendingGroups.findFirst({
      where: { ID: id, userID: ownerId },
      include: { spendings: { select: LINE_SELECT } },
    });
    if (!row) return null;
    return SpendingGroup.restore({
      id,
      ownerId,
      date: toDay(row.date),
      label: row.label,
      lines: row.spendings.map((line) => ({
        id: line.ID,
        amount: toMoney(line.amount, line.currency),
        categoryId: line.categoryID,
        detail: line.detail,
        receipt: line.invoicefile,
        isNew: false,
      })),
    });
  }

  async candidates(ids: string[], ownerId: string): Promise<GroupCandidate[]> {
    const rows = await this.prisma.spendings.findMany({
      where: { userID: ownerId, ID: { in: ids } },
      select: { ...LINE_SELECT, date: true, groupID: true },
    });
    return rows.map((row) => ({
      id: row.ID,
      date: toDay(row.date),
      amount: toMoney(row.amount, row.currency),
      categoryId: row.categoryID,
      receipt: row.invoicefile,
      groupId: row.groupID,
    }));
  }

  async save(group: SpendingGroup): Promise<void> {
    const ownerId = group.ownerId;
    const lines = group.lines();
    const added = lines.filter((line) => line.isNew);
    const removed = group.removedLineIds();
    const absorbed = group.absorbedGroupIds();

    await this.prisma.$transaction([
      group.isNew
        ? this.prisma.spendingGroups.create({
            data: { ID: group.id, userID: ownerId, date: group.date.toDate(), label: group.label },
          })
        : this.prisma.spendingGroups.update({ where: { ID: group.id }, data: { label: group.label } }),
      ...(removed.length > 0
        ? [this.prisma.spendings.deleteMany({ where: { userID: ownerId, ID: { in: removed } } })]
        : []),
      ...lines
        .filter((line) => !line.isNew)
        .map((line) =>
          this.prisma.spendings.update({
            where: { ID: line.id },
            data: {
              groupID: group.id,
              label: group.storedLabelOf(line),
              detail: line.detail,
              amount: line.amount.toDecimalString(),
              categoryID: line.categoryId,
              invoicefile: line.receipt,
            },
          }),
        ),
      ...(added.length > 0
        ? [
            this.prisma.spendings.createMany({
              data: added.map((line) => ({
                ID: line.id,
                userID: ownerId,
                date: group.date.toDate(),
                itemType: SPENDING_ITEM_TYPE,
                label: group.storedLabelOf(line),
                detail: line.detail,
                amount: line.amount.toDecimalString(),
                categoryID: line.categoryId,
                currency: currencyColumn(line.amount),
                invoicefile: line.receipt,
                groupID: group.id,
              })),
            }),
          ]
        : []),
      // Groups a merge took every line from.
      ...(absorbed.length > 0
        ? [
            this.prisma.spendingGroups.deleteMany({
              where: { userID: ownerId, ID: { in: absorbed }, spendings: { none: {} } },
            }),
          ]
        : []),
    ]);
  }

  async remove(group: SpendingGroup): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.spendings.deleteMany({ where: { userID: group.ownerId, groupID: group.id } }),
      this.prisma.spendingGroups.delete({ where: { ID: group.id } }),
    ]);
  }

  async dissolve(group: SpendingGroup): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.spendings.updateMany({
        where: { userID: group.ownerId, groupID: group.id },
        data: { groupID: null, detail: null },
      }),
      this.prisma.spendingGroups.delete({ where: { ID: group.id } }),
    ]);
  }
}
