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
import type { SpendingLabelSuggestion } from "@spendings/dto/spending-label-suggestion.interface";
import { PrismaService } from "../prisma/prisma.service";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

// Whole-history search (COS-114): require a minimal query so a stray keystroke
// can't scan the entire table, and stream results a page at a time.
const MIN_SEARCH_LENGTH = 2;
const SEARCH_PAGE_SIZE = 50;

// Label autocomplete (COS-23): the modal shows a small chip row under the field,
// so only the top few labels are returned. Matches the maquette's three chips.
const LABEL_SUGGESTIONS_LIMIT = 3;

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

  private async assertCategoryAccessible(categoryID: string, userID: string): Promise<void> {
    const category = await this.prisma.categories.findFirst({
      where: {
        ID: categoryID,
        OR: [{ userID }, { userID: null }],
      },
      select: { ID: true },
    });

    if (!category) {
      throw new BadRequestException("Invalid category ID");
    }
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
    if (normalizedType === "exceptional") {
      const row = await this.prisma.exceptionals.findFirst({
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
      await this.assertCategoryAccessible(category.ID, userID);
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
      await this.assertCategoryAccessible(categoryID, userID);
      await this.prisma.spendings.updateMany({
        where: { ID: spendingID, userID },
        data: { label: dto.label, amount: dto.amount, categoryID },
      });
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
      category: category && (category.userID === userID || category.userID === null) ? category.name : null,
      categoryColor: category && (category.userID === userID || category.userID === null) ? category.color : null,
    }));
  }

  // Whole-history text search over the user's spendings (COS-114). Matches the
  // label OR the (accessible) category name, newest first, capped. Returns the
  // capped page plus the unbounded total so the UI can say "N résultats". The
  // category is flattened to name/color exactly like getSpendings, and a category
  // owned by another user is nulled out defensively.
  async searchSpendings(query: string, userID: string, cursor?: string, year?: string) {
    const q = query.trim();
    const hasText = q.length >= MIN_SEARCH_LENGTH;
    const yearNum = year ? Number(year) : Number.NaN;
    const hasYear = Number.isInteger(yearNum);

    // Need at least a usable term OR a year filter, else there is nothing to search.
    if (!hasText && !hasYear) {
      return { items: [], nextCursor: null, total: 0 };
    }

    // Escape LIKE metacharacters so a literal % or _ in the term (e.g. "100%",
    // "T_Mobile") matches literally instead of acting as a wildcard. MySQL's
    // default LIKE escape is backslash; the single pass escapes the backslash too.
    const escaped = q.replace(/[\\%_]/g, "\\$&");

    const where = {
      userID,
      ...(hasText
        ? { OR: [{ label: { contains: escaped } }, { category: { is: { name: { contains: escaped } } } }] }
        : {}),
      // Year filter: half-open [year-01-01, next-year-01-01) covers the whole year
      // regardless of any time component on the date column.
      ...(hasYear
        ? {
            date: {
              gte: new Date(`${yearNum}-01-01T00:00:00.000Z`),
              lt: new Date(`${yearNum + 1}-01-01T00:00:00.000Z`),
            },
          }
        : {}),
    };

    // Keyset (cursor) pagination: a common term (e.g. a category name) can match
    // thousands of rows, so results stream a page at a time as the user scrolls,
    // rather than capping (which would hide older months) or shipping everything.
    // Ordered newest-first with the unique ID as tiebreaker so the cursor is
    // stable. We over-fetch one row to know whether a further page exists without
    // a spurious empty request at exact page-size multiples. `total` is counted
    // once, on the first page only (COS-114).
    const rows = await this.prisma.spendings.findMany({
      where,
      orderBy: [{ date: "desc" }, { ID: "desc" }],
      include: { category: true },
      take: SEARCH_PAGE_SIZE + 1,
      ...(cursor ? { cursor: { ID: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > SEARCH_PAGE_SIZE;
    const pageRows = hasMore ? rows.slice(0, SEARCH_PAGE_SIZE) : rows;

    const items = pageRows.map(({ category, ...spending }) => ({
      ...spending,
      category: category && (category.userID === userID || category.userID === null) ? category.name : null,
      categoryColor: category && (category.userID === userID || category.userID === null) ? category.color : null,
    }));

    const nextCursor = hasMore ? items[items.length - 1].ID : null;
    const total = cursor ? undefined : await this.prisma.spendings.count({ where });

    return { items, nextCursor, total };
  }

  // Years the user has spendings in, newest first — powers the search modal's
  // year filter (COS-114). Derived from the min/max spending date, so a
  // continuously-used account yields a contiguous range.
  async getSpendingYears(userID: string): Promise<number[]> {
    const range = await this.prisma.spendings.aggregate({
      where: { userID },
      _min: { date: true },
      _max: { date: true },
    });

    const min = range._min.date;
    const max = range._max.date;
    if (!min || !max) {
      return [];
    }

    const years: number[] = [];
    for (let y = max.getUTCFullYear(); y >= min.getUTCFullYear(); y--) {
      years.push(y);
    }
    return years;
  }

  // Label autocomplete for the spending modal (COS-23). Returns the user's own
  // past spending labels ranked by how often they've used each, filtered by the
  // typed prefix, each carrying its most-used category so selecting one can
  // pre-fill the category. An empty query returns the most frequent labels (shown
  // when the field is empty); the exact current input is excluded so we never
  // suggest what's already fully typed. Category resolution honors the owned-or-
  // global rule used across the app; a label only ever used uncategorized yields a
  // null category.
  async getLabelSuggestions(query: string, userID: string): Promise<SpendingLabelSuggestion[]> {
    const q = query.trim();
    // Escape LIKE metacharacters so a literal % or _ in the prefix matches
    // literally instead of acting as a wildcard (same guard as searchSpendings).
    const escaped = q.replace(/[\\%_]/g, "\\$&");

    const grouped = await this.prisma.spendings.groupBy({
      by: ["label", "categoryID"],
      where: { userID, ...(q ? { label: { startsWith: escaped } } : {}) },
      _count: true,
    });

    // Fold the (label, category) groups into one bucket per label: total uses,
    // plus — among the categorized uses only — the tally per category.
    const buckets = new Map<string, { total: number; byCategory: Map<string, number> }>();
    for (const group of grouped) {
      const bucket = buckets.get(group.label) ?? { total: 0, byCategory: new Map<string, number>() };
      bucket.total += group._count;
      if (group.categoryID) {
        bucket.byCategory.set(group.categoryID, (bucket.byCategory.get(group.categoryID) ?? 0) + group._count);
      }
      buckets.set(group.label, bucket);
    }

    // Rank by total use (then alphabetically), drop the exact current input, and
    // keep the top few — the modal shows a small chip row.
    const qLower = q.toLowerCase();
    const ranked = [...buckets.entries()]
      .filter(([label]) => label.toLowerCase() !== qLower)
      .sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]))
      .slice(0, LABEL_SUGGESTIONS_LIMIT);

    // Dominant category id per surviving label (most-used; null if only ever
    // uncategorized).
    const dominantCategoryId = (byCategory: Map<string, number>): string | null => {
      let winnerId: string | null = null;
      let winnerCount = 0;
      for (const [categoryID, count] of byCategory) {
        if (count > winnerCount) {
          winnerCount = count;
          winnerId = categoryID;
        }
      }
      return winnerId;
    };

    const labelToCategoryId = new Map(ranked.map(([label, bucket]) => [label, dominantCategoryId(bucket.byCategory)]));

    // Resolve those ids to names in one query, honoring the owned-or-global rule.
    const ids = [...new Set([...labelToCategoryId.values()].filter((id): id is string => id !== null))];
    const categories =
      ids.length > 0
        ? await this.prisma.categories.findMany({
            where: { ID: { in: ids }, OR: [{ userID }, { userID: null }] },
            select: { ID: true, name: true },
          })
        : [];
    const nameById = new Map(categories.map((c) => [c.ID, c.name]));

    return ranked.map(([label]) => {
      const categoryID = labelToCategoryId.get(label);
      return { label, category: categoryID ? (nameById.get(categoryID) ?? null) : null };
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
    } else if (itemType === "exceptional") {
      await this.prisma.exceptionals.updateMany({
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
    } else if (itemType === "exceptional") {
      await this.prisma.exceptionals.updateMany({
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
