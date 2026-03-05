import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { access, unlink } from "fs/promises";
import { constants } from "fs";
import { readFile } from "fs/promises";
import { resolve } from "path";
import sharp from "sharp";
import { AppConfig } from "@config/app.config";
import { SshBackupService } from "@infrastructure/ssh-backup/ssh-backup.service";
import { isValidImageFile } from "@spendings/upload/upload.config";
import { PrismaService } from "../prisma/prisma.service";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

@Injectable()
export class SpendingsService {
  private readonly logger = new Logger(SpendingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly sshBackup: SshBackupService,
  ) {}

  private safePath(base: string, userID: string, filename: string): string {
    const userDir = resolve(base, userID);
    const filePath = resolve(userDir, filename);
    if (!filePath.startsWith(userDir + "/")) {
      throw new BadRequestException("Invalid file path");
    }
    return filePath;
  }

  async getInvoiceImage(
    spendingID: string,
    userID: string,
    itemType: string,
  ): Promise<{ data: string; contentType: string } | null> {
    const invoicesPath = this.configService.getOrThrow<AppConfig>("app").invoicesPath;

    const invoicefile = await this.getInvoiceFileName(spendingID, userID, itemType);
    if (!invoicefile) return null;

    const filePath = this.safePath(invoicesPath, userID, invoicefile);
    const imageFile = await readFile(filePath);
    const base64Image = imageFile.toString("base64");
    const ext = (invoicefile.split(".").pop() ?? "").toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? "image/jpeg";
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

  async updateSpending(
    spendingID: string,
    userID: string,
    dto: {
      label: string;
      amount: number;
      category?: { ID?: string | null; name?: string; color?: string | null };
    },
  ): Promise<{ success: boolean }> {
    const categoryID = dto.category?.ID ?? null;
    const { name, color } = dto.category ?? {};

    const spending = await this.prisma.spendings.findFirst({
      where: { ID: spendingID, userID },
      select: { categoryID: true },
    });

    if (!spending) {
      throw new NotFoundException("Spending not found");
    }

    const createNewCategoryAndUpdate = async (categoryName: string, categoryColor: string) => {
      const existingCategory = await this.prisma.categories.findFirst({
        where: { userID, name: categoryName },
      });
      let newCategoryID: string;
      if (existingCategory) {
        newCategoryID = existingCategory.ID;
      } else {
        newCategoryID = randomUUID();
        await this.prisma.categories.create({
          data: {
            ID: newCategoryID,
            userID,
            name: categoryName,
            color: categoryColor,
          },
        });
      }
      await this.prisma.spendings.updateMany({
        where: { ID: spendingID, userID },
        data: { label: dto.label, amount: dto.amount, categoryID: newCategoryID },
      });
    };

    if (categoryID !== null && spending.categoryID !== categoryID) {
      const categoryExists = await this.prisma.categories.findFirst({
        where: { ID: categoryID },
      });
      if (categoryExists) {
        await this.prisma.spendings.updateMany({
          where: { ID: spendingID, userID },
          data: { label: dto.label, amount: dto.amount, categoryID },
        });
      } else if (name && color) {
        await createNewCategoryAndUpdate(name, color);
      }
    } else if (categoryID === null) {
      if (color && name) {
        await createNewCategoryAndUpdate(name, color);
      } else {
        await this.prisma.spendings.updateMany({
          where: { ID: spendingID, userID },
          data: { label: dto.label, amount: dto.amount, categoryID: null },
        });
      }
    } else {
      await this.prisma.spendings.updateMany({
        where: { ID: spendingID, userID },
        data: { label: dto.label, amount: dto.amount },
      });
    }

    return { success: true };
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

  async getSpendingsCharts(from: string, to: string, userID: string) {
    const grouped = await this.prisma.spendings.groupBy({
      by: ["categoryID"],
      where: {
        userID,
        date: { gte: new Date(from), lte: new Date(to) },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    });

    const categoryIDs = grouped.map((g) => g.categoryID).filter((id): id is string => id !== null);

    const categories =
      categoryIDs.length > 0
        ? await this.prisma.categories.findMany({
            where: { ID: { in: categoryIDs } },
            select: { ID: true, name: true, color: true },
          })
        : [];

    const categoryMap = new Map(categories.map((c) => [c.ID, c]));

    return grouped.map((g) => {
      const cat = g.categoryID ? categoryMap.get(g.categoryID) : null;
      return {
        value: g._sum.amount,
        category: cat?.name ?? null,
        categoryColor: cat?.color ?? null,
      };
    });
  }

  async deleteSpending(spendingID: string, userID: string): Promise<{ success: boolean }> {
    const deleted = await this.prisma.spendings.deleteMany({
      where: { ID: spendingID, userID },
    });

    if (deleted.count === 0) {
      throw new NotFoundException("Spending not found");
    }

    return { success: true };
  }

  async deleteInvoiceImage(
    spendingID: string,
    userID: string,
    itemType: string,
    invoicefile: string,
  ): Promise<{ msg: string }> {
    const invoicesPath = this.configService.getOrThrow<AppConfig>("app").invoicesPath;
    const filePath = this.safePath(invoicesPath, userID, invoicefile);

    await unlink(filePath);

    if (itemType === "spending") {
      await this.prisma.spendings.updateMany({
        where: { ID: spendingID, userID },
        data: { invoicefile: null },
      });
    }

    this.backupDelete(userID, invoicefile);

    return { msg: "INVOICE_IMAGE_DELETED" };
  }

  async uploadInvoiceImage(
    filepath: string,
    filename: string,
    spendingID: string,
    userID: string,
    itemType: string,
  ): Promise<{ data: string; contentType: string }> {
    sharp.cache(false);

    await access(filepath, constants.F_OK);

    if (!(await isValidImageFile(filepath))) {
      await unlink(filepath);
      throw new BadRequestException("INVALID_IMAGE_FILE");
    }

    const imageMetadata = await sharp(filepath).metadata();
    const biggerSide = (imageMetadata.width ?? 0) > (imageMetadata.height ?? 0) ? "width" : "height";
    const biggerSideSize = biggerSide === "width" ? 1125 : 1500;

    const parts = filepath.split(".");
    const fileExtension = parts.pop() ?? "jpg";
    const resizedPathAndFilename = parts.join(".") + "-r.";
    const outputPath = resizedPathAndFilename + fileExtension;

    await sharp(filepath)
      .resize({
        fit: sharp.fit.contain,
        [biggerSide]: biggerSideSize,
      })
      .toFile(outputPath);

    await unlink(filepath);

    const resizedFilename = filename.slice(0, filename.search(/\./)) + "-r." + fileExtension;

    if (itemType === "spending") {
      await this.prisma.spendings.updateMany({
        where: { ID: spendingID, userID },
        data: { invoicefile: resizedFilename },
      });
    }

    this.backupCopy(outputPath, userID, resizedFilename);

    const result = await this.getInvoiceImage(spendingID, userID, itemType);
    if (!result) {
      throw new Error("Failed to read uploaded image");
    }
    return result;
  }

  private backupCopy(localPath: string, userID: string, filename: string): void {
    if (!this.sshBackup.enabled) return;
    const remotePath = `${this.sshBackup.backupInvoicesPath}${userID}/${filename}`;
    this.sshBackup.copyFile(localPath, remotePath).catch((err: Error) => {
      this.logger.error(`SSH backup copy failed for ${remotePath}: ${err.message}`);
    });
  }

  private backupDelete(userID: string, filename: string): void {
    if (!this.sshBackup.enabled) return;
    const remotePath = `${this.sshBackup.backupInvoicesPath}${userID}/${filename}`;
    this.sshBackup.deleteFile(remotePath).catch((err: Error) => {
      this.logger.error(`SSH backup delete failed for ${remotePath}: ${err.message}`);
    });
  }
}
