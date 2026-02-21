import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(start: string, userID: string) {
    const dashboard = await this.prisma.dashboards.findFirst({
      where: {
        userID,
        dateFrom: new Date(start),
      },
    });

    if (!dashboard) {
      return null;
    }

    return {
      ...dashboard,
      initialAmount: Number(dashboard.initialAmount),
      initialCeiling: dashboard.initialCeiling ? Number(dashboard.initialCeiling) : null,
    };
  }

  async createDashboard(dto: { start: string; end: string; amount: number }, userID: string) {
    const id = randomUUID();
    await this.prisma.dashboards.create({
      data: {
        ID: id,
        dateFrom: new Date(dto.start),
        dateTo: new Date(dto.end),
        initialAmount: dto.amount,
        userID,
      },
    });
    return { insertId: id, ID: id };
  }

  async updateDashboard(id: string, userID: string, dto: { amount?: number; ceiling?: number }) {
    const existing = await this.prisma.dashboards.findFirst({
      where: { ID: id, userID },
    });

    if (!existing) {
      throw new NotFoundException("Dashboard not found");
    }

    const data: { initialAmount?: number; initialCeiling?: number } = {};
    if (dto.amount !== undefined && dto.amount !== null) {
      data.initialAmount = dto.amount;
    }
    if (dto.ceiling !== undefined && dto.ceiling !== null) {
      data.initialCeiling = dto.ceiling;
    }

    if (Object.keys(data).length === 0) {
      return existing;
    }

    return this.prisma.dashboards.update({
      where: { ID: id },
      data,
    });
  }
}
