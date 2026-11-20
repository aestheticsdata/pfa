import { randomUUID } from "node:crypto";
import { EXCEPTIONAL_ITEM_TYPE } from "@contexts/budget-planning/domain/exceptional-years";
import type {
  ClosedRange,
  ExceptionalFields,
  ExceptionalItem,
  NewExceptional,
  OwnedRecord,
} from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";
import { ExceptionalRepository } from "@contexts/budget-planning/domain/ports/exceptional.repository";
import { PrismaService } from "@db/prisma.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PrismaExceptionalRepository extends ExceptionalRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  list(ownerId: string, year: ClosedRange | null): Promise<ExceptionalItem[]> {
    return this.prisma.exceptionals.findMany({
      where: { userID: ownerId, ...(year ? { date: year } : {}) },
      orderBy: { date: "desc" },
      // Listed, never the whole row: a new column stays out of the response until asked for (PFA-257).
      select: {
        ID: true,
        date: true,
        itemType: true,
        label: true,
        description: true,
        amount: true,
        currency: true,
        categoryName: true,
        categoryColor: true,
        invoicefile: true,
      },
    });
  }

  async dates(ownerId: string): Promise<Date[]> {
    const rows = await this.prisma.exceptionals.findMany({ where: { userID: ownerId }, select: { date: true } });
    return rows.map((row) => row.date);
  }

  async add(exceptional: NewExceptional, ownerId: string): Promise<string> {
    const ID = randomUUID();
    await this.prisma.exceptionals.create({
      data: { ID, userID: ownerId, ...exceptional, itemType: EXCEPTIONAL_ITEM_TYPE },
    });
    return ID;
  }

  async edit(exceptional: OwnedRecord, fields: ExceptionalFields): Promise<boolean> {
    const updated = await this.prisma.exceptionals.updateMany({
      where: { ID: exceptional.id, userID: exceptional.ownerId },
      data: fields,
    });
    return updated.count > 0;
  }

  async remove(exceptional: OwnedRecord): Promise<boolean> {
    const deleted = await this.prisma.exceptionals.deleteMany({
      where: { ID: exceptional.id, userID: exceptional.ownerId },
    });
    return deleted.count > 0;
  }
}
