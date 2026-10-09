import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { SpendingsService } from "@spendings/spendings.service";
import { ReceiptFilesService } from "@spendings/receipts/receipt-files.service";
import { composeGroupLineLabel, isSameDay } from "@spendings/groups/group-label";
import type { CreateSpendingGroupDto } from "@spendings/dto/create-spending-group.dto";
import type { UpdateSpendingGroupDto } from "@spendings/dto/update-spending-group.dto";
import type { MergeSpendingGroupDto } from "@spendings/dto/merge-spending-group.dto";
import type { SpendingGroupLineDto } from "@spendings/dto/spending-group-line.dto";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Groups of spendings bought on one receipt (PFA-189). A group is a store/name
 * and a date; its lines are ordinary spendings carrying `groupID`, so every
 * total, breakdown and search keeps counting each line in its own category.
 * The group's receipt is the `invoicefile` shared by all its lines.
 */
@Injectable()
export class SpendingGroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spendings: SpendingsService,
    private readonly receiptFiles: ReceiptFilesService,
  ) {}

  private async resolveLineCategories(lines: SpendingGroupLineDto[], userID: string): Promise<(string | null)[]> {
    // Sequential: two lines typing the same new category must create it once.
    const ids: (string | null)[] = [];
    for (const line of lines) {
      ids.push(await this.spendings.resolveCategoryID(line.category, userID));
    }
    return ids;
  }

  private async findGroup(groupID: string, userID: string) {
    const group = await this.prisma.spendingGroups.findFirst({
      where: { ID: groupID, userID },
      include: { spendings: { select: { ID: true, invoicefile: true, currency: true } } },
    });
    if (!group) {
      throw new NotFoundException("Group not found");
    }
    return group;
  }

  async create(dto: CreateSpendingGroupDto, userID: string): Promise<{ ID: string; spendingIDs: string[] }> {
    const categoryIDs = await this.resolveLineCategories(dto.lines, userID);
    const groupID = randomUUID();
    const date = new Date(dto.date);
    const lines = dto.lines.map((line, i) => ({
      ID: randomUUID(),
      userID,
      date,
      itemType: "spending",
      label: composeGroupLineLabel(dto.label, line.detail),
      detail: line.detail?.trim() || null,
      amount: line.amount,
      categoryID: categoryIDs[i],
      currency: dto.currency,
      groupID,
    }));

    await this.prisma.$transaction([
      this.prisma.spendingGroups.create({ data: { ID: groupID, userID, date, label: dto.label.trim() } }),
      this.prisma.spendings.createMany({ data: lines }),
    ]);

    // The IDs let the front chain the group's receipt upload (POST /spendings/receipts).
    return { ID: groupID, spendingIDs: lines.map((line) => line.ID) };
  }

  async update(groupID: string, dto: UpdateSpendingGroupDto, userID: string): Promise<{ success: boolean }> {
    const group = await this.findGroup(groupID, userID);
    const currentIDs = new Set(group.spendings.map((s) => s.ID));
    if (dto.lines.some((line) => line.ID && !currentIDs.has(line.ID))) {
      throw new BadRequestException("Line does not belong to the group");
    }

    const categoryIDs = await this.resolveLineCategories(dto.lines, userID);
    const keptIDs = new Set(dto.lines.flatMap((line) => (line.ID ? [line.ID] : [])));
    const removed = group.spendings.filter((s) => !keptIDs.has(s.ID));
    // A line added while editing joins the group's receipt.
    const invoicefile = group.spendings.find((s) => s.invoicefile)?.invoicefile ?? null;
    const currency = group.spendings[0]?.currency ?? null;
    const label = dto.label.trim();

    await this.prisma.$transaction([
      this.prisma.spendingGroups.update({ where: { ID: groupID }, data: { label } }),
      this.prisma.spendings.deleteMany({ where: { userID, ID: { in: removed.map((s) => s.ID) } } }),
      ...dto.lines.map((line, i) => {
        const data = {
          label: composeGroupLineLabel(label, line.detail),
          detail: line.detail?.trim() || null,
          amount: line.amount,
          categoryID: categoryIDs[i],
        };
        return line.ID
          ? this.prisma.spendings.update({ where: { ID: line.ID }, data })
          : this.prisma.spendings.create({
              data: {
                ...data,
                ID: randomUUID(),
                userID,
                date: group.date,
                itemType: "spending",
                currency,
                invoicefile,
                groupID,
              },
            });
      }),
    ]);

    await this.receiptFiles.release(
      userID,
      removed.map((s) => s.invoicefile),
    );
    return { success: true };
  }

  async delete(groupID: string, userID: string): Promise<{ success: boolean }> {
    const group = await this.findGroup(groupID, userID);

    await this.prisma.$transaction([
      this.prisma.spendings.deleteMany({ where: { userID, groupID } }),
      this.prisma.spendingGroups.delete({ where: { ID: groupID } }),
    ]);

    await this.receiptFiles.release(
      userID,
      group.spendings.map((s) => s.invoicefile),
    );
    return { success: true };
  }

  /**
   * The lines become separate spendings again. Their stored labels already read
   * "<group> — <detail>", and they keep the group's receipt — which thereby
   * becomes a receipt shared between them.
   */
  async ungroup(groupID: string, userID: string): Promise<{ spendingIDs: string[] }> {
    const group = await this.findGroup(groupID, userID);

    await this.prisma.$transaction([
      this.prisma.spendings.updateMany({ where: { userID, groupID }, data: { groupID: null, detail: null } }),
      this.prisma.spendingGroups.delete({ where: { ID: groupID } }),
    ]);

    return { spendingIDs: group.spendings.map((s) => s.ID) };
  }

  /**
   * Existing spendings of one day become the lines of a new group. The first
   * receipt found (in the order sent) is kept for the whole group; the others
   * are dropped, and their files removed if nothing else holds them. Groups
   * left empty by the move are deleted.
   */
  async merge(dto: MergeSpendingGroupDto, userID: string): Promise<{ ID: string; invoicefile: string | null }> {
    const ids = dto.lines.map((line) => line.spendingID);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException("Duplicate spending");
    }
    const rows = await this.prisma.spendings.findMany({
      where: { userID, ID: { in: ids } },
      select: { ID: true, date: true, invoicefile: true, groupID: true },
    });
    if (rows.length !== ids.length) {
      throw new NotFoundException("Spending not found");
    }
    const date = rows[0].date;
    if (rows.some((row) => !isSameDay(row.date, date))) {
      throw new BadRequestException("A group spans a single day");
    }

    const byID = new Map(rows.map((row) => [row.ID, row]));
    const ordered = ids.map((id) => byID.get(id)!);
    const invoicefile = ordered.find((row) => row.invoicefile)?.invoicefile ?? null;
    const formerGroupIDs = [...new Set(rows.flatMap((row) => (row.groupID ? [row.groupID] : [])))];
    const groupID = randomUUID();
    const label = dto.label.trim();

    await this.prisma.$transaction([
      this.prisma.spendingGroups.create({ data: { ID: groupID, userID, date, label } }),
      ...dto.lines.map((line) =>
        this.prisma.spendings.update({
          where: { ID: line.spendingID },
          data: {
            groupID,
            detail: line.detail?.trim() || null,
            label: composeGroupLineLabel(label, line.detail),
            invoicefile,
          },
        }),
      ),
      this.prisma.spendingGroups.deleteMany({
        where: { userID, ID: { in: formerGroupIDs }, spendings: { none: {} } },
      }),
    ]);

    await this.receiptFiles.release(
      userID,
      rows.map((row) => row.invoicefile),
    );
    return { ID: groupID, invoicefile };
  }
}
