import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import { join } from "path";
import { AppConfig } from "@config/app.config";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SpendingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getInvoiceImage(
    spendingID: string,
    userID: string,
    itemType: string,
  ): Promise<{ data: string; contentType: string } | null> {
    const invoicesPath = this.configService.getOrThrow<AppConfig>("app").invoicesPath;

    const invoicefile = await this.getInvoiceFileName(spendingID, userID, itemType);
    if (!invoicefile) return null;

    const filePath = join(invoicesPath, userID, invoicefile);
    const imageFile = await readFile(filePath);
    const base64Image = imageFile.toString("base64");
    const ext = invoicefile.split(".").pop();
    const contentType = `image/${ext}`;
    const data = `data:${contentType};base64,${base64Image}`;

    return { data, contentType };
  }

  private async getInvoiceFileName(spendingID: string, userID: string, itemType: string): Promise<string | null> {
    const normalizedType = itemType.toLowerCase();
    if (normalizedType === "spending") {
      const row = await this.prisma.spendings.findFirst({
        where: { ID: spendingID, userID },
        select: { invoicefile: true },
      });
      return row?.invoicefile ?? null;
    }
    if (normalizedType === "recurring") {
      const row = await this.prisma.recurrings.findFirst({
        where: { ID: spendingID, userID },
        select: { invoicefile: true },
      });
      return row?.invoicefile ?? null;
    }
    return null;
  }

  async createSpending(
    dto: {
      date: string;
      label: string;
      amount: number;
      category?: { ID?: string | null; name?: string; color?: string | null };
      currency: string;
    },
    userID: string,
  ): Promise<string> {
    let categoryID: string | null = null;

    const category = dto.category;
    if (category?.ID) {
      categoryID = category.ID;
    } else if (category?.ID === null && category?.color != null && category?.name) {
      const existingCategory = await this.prisma.categories.findFirst({
        where: {
          userID,
          name: category.name,
        },
      });
      if (existingCategory) {
        categoryID = existingCategory.ID;
      } else {
        const newCategoryID = randomUUID();
        await this.prisma.categories.create({
          data: {
            ID: newCategoryID,
            userID,
            name: category.name,
            color: category.color,
          },
        });
        categoryID = newCategoryID;
      }
    }

    const spendingID = randomUUID();
    await this.prisma.spendings.create({
      data: {
        ID: spendingID,
        userID,
        date: new Date(dto.date),
        label: dto.label,
        amount: dto.amount,
        categoryID,
        currency: dto.currency,
        itemType: "spending",
      },
    });

    return "new spending added";
  }

  async getSpendings(from: string, to: string, userID: string) {
    const results = await this.prisma.spendings.findMany({
      where: {
        userID,
        date: { gte: new Date(from), lte: new Date(to) },
      },
      orderBy: { date: "asc" },
      include: {
        category: true,
      },
    });

    return results.map(({ category, ...spending }) => ({
      ...spending,
      category: category?.name ?? null,
      categoryColor: category?.color ?? null,
    }));
  }
}
