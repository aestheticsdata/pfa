import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { access, unlink } from "fs/promises";
import { constants } from "fs";
import { resolve } from "path";
import sharp from "sharp";
import { AppConfig } from "@config/app.config";
import { SshBackupService } from "@infrastructure/ssh-backup/ssh-backup.service";
import { isValidImageFile } from "@spendings/upload/upload.config";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * The receipt image files on disk and their mirror on the memosyne backup.
 *
 * A receipt is a file name stored in `invoicefile`; several rows may hold the
 * same name — a group's lines, or spendings sharing one receipt (PFA-189). A
 * file is therefore only removed once no row references it any more, and every
 * removal / addition is mirrored on the backup under the same name, so legacy
 * files and their backup copies never need renaming.
 */
@Injectable()
export class ReceiptFilesService {
  private readonly logger = new Logger(ReceiptFilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly sshBackup: SshBackupService,
  ) {}

  private get invoicesPath(): string {
    return this.configService.getOrThrow<AppConfig>("app").invoicesPath;
  }

  safePath(userID: string, filename: string): string {
    const userDir = resolve(this.invoicesPath, userID);
    const filePath = resolve(userDir, filename);
    if (!filePath.startsWith(userDir + "/")) {
      throw new BadRequestException("Invalid file path");
    }
    return filePath;
  }

  /**
   * Validates and downsizes a freshly uploaded file, backs it up, and returns
   * the stored (`-r`) file name. The multer original is removed.
   */
  async store(filepath: string, filename: string, userID: string): Promise<string> {
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
    const outputPath = parts.join(".") + "-r." + fileExtension;

    await sharp(filepath)
      .resize({
        fit: sharp.fit.contain,
        [biggerSide]: biggerSideSize,
      })
      .toFile(outputPath);

    await unlink(filepath);

    const resizedFilename = filename.slice(0, filename.search(/\./)) + "-r." + fileExtension;
    this.backupCopy(outputPath, userID, resizedFilename);
    return resizedFilename;
  }

  /**
   * Removes each file (locally and on the backup) that no row references any
   * more. Call it after the rows dropped or replaced their `invoicefile`.
   */
  async release(userID: string, filenames: (string | null | undefined)[]): Promise<void> {
    const unique = [...new Set(filenames.filter((f): f is string => !!f))];
    for (const filename of unique) {
      if (await this.isReferenced(userID, filename)) continue;
      try {
        await unlink(this.safePath(userID, filename));
      } catch (err) {
        // Already gone locally: still drop the backup copy below.
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      }
      this.backupDelete(userID, filename);
    }
  }

  private async isReferenced(userID: string, invoicefile: string): Promise<boolean> {
    const where = { userID, invoicefile };
    const [spendings, exceptionals, recurrings] = await Promise.all([
      this.prisma.spendings.count({ where }),
      this.prisma.exceptionals.count({ where }),
      this.prisma.recurrings.count({ where }),
    ]);
    return spendings + exceptionals + recurrings > 0;
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
