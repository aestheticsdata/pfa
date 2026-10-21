import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { ExceptionalItem } from "@exceptionals/interfaces/exceptionalItemTypes";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ExceptionalsService {
  constructor(private readonly prisma: PrismaService) {}

  async getExceptionals(userID: string, year?: string): Promise<ExceptionalItem[]> {
    const where: { userID: string; date?: { gte: Date; lte: Date } } = { userID };
    if (year) {
      const y = parseInt(year, 10);
      if (!Number.isNaN(y)) {
        where.date = {
          gte: new Date(`${y}-01-01`),
          lte: new Date(`${y}-12-31`),
        };
      }
    }
    return this.prisma.exceptionals.findMany({
      where,
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

  async getAvailableYears(userID: string): Promise<number[]> {
    const rows = await this.prisma.exceptionals.findMany({
      where: { userID },
      select: { date: true },
    });
    const years = new Set<number>();
    for (const row of rows) {
      years.add(row.date.getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }

  async createExceptional(
    dto: {
      date: string;
      label: string;
      description?: string;
      amount: number;
      currency?: string;
      categoryName?: string;
      categoryColor?: string;
    },
    userID: string,
  ): Promise<{ message: string; ID: string }> {
    const id = randomUUID();
    await this.prisma.exceptionals.create({
      data: {
        ID: id,
        userID,
        date: new Date(dto.date),
        label: dto.label,
        description: dto.description ?? null,
        amount: dto.amount,
        currency: dto.currency ?? null,
        categoryName: dto.categoryName ?? null,
        categoryColor: dto.categoryColor ?? null,
        itemType: "exceptional",
      },
    });
    return { message: "new exceptional added", ID: id };
  }

  async updateExceptional(
    id: string,
    userID: string,
    dto: {
      date: string;
      label: string;
      description?: string;
      amount: number;
      categoryName?: string;
      categoryColor?: string;
    },
  ): Promise<{ success: boolean }> {
    const updated = await this.prisma.exceptionals.updateMany({
      where: { ID: id, userID },
      data: {
        date: new Date(dto.date),
        label: dto.label,
        description: dto.description ?? null,
        amount: dto.amount,
        categoryName: dto.categoryName ?? null,
        categoryColor: dto.categoryColor ?? null,
      },
    });

    if (updated.count === 0) {
      throw new NotFoundException("Exceptional not found");
    }

    return { success: true };
  }

  async deleteExceptional(id: string, userID: string): Promise<{ success: boolean }> {
    const deleted = await this.prisma.exceptionals.deleteMany({
      where: { ID: id, userID },
    });

    if (deleted.count === 0) {
      throw new NotFoundException("Exceptional not found");
    }

    return { success: true };
  }
}
