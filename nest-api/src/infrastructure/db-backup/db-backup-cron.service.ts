import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { exec } from "child_process";
import { mkdir } from "fs/promises";
import { join } from "path";
import { promisify } from "util";
import { SshBackupService } from "@infrastructure/ssh-backup/ssh-backup.service";
import type { DbBackupConfig } from "@config/db-backup.config";

const execAsync = promisify(exec);

@Injectable()
export class DbBackupCronService {
  private readonly logger = new Logger(DbBackupCronService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly sshBackup: SshBackupService,
  ) {}

  @Cron("0 0 */12 * * *")
  async handleDbBackup(): Promise<void> {
    const config = this.configService.get<DbBackupConfig>("dbBackup");
    if (!config?.enabled || !this.sshBackup.enabled) {
      return;
    }

    if (!config.dbUser || !config.dbPassword || !config.dbName || !config.dumpPath || !config.remoteBackupPath) {
      this.logger.warn(
        "DB backup skipped: missing config (DB_USER, DB_PASSWORD, DB, PFA_DUMP_PATH, PFA_BACKUP_SERVER_PATH)",
      );
      return;
    }

    this.logger.log("mysqlDump started");

    const dumpFile = join(config.dumpPath, "pfadump.sql");

    try {
      await mkdir(config.dumpPath, { recursive: true });
      await execAsync(`mysqldump -u${config.dbUser} -p${config.dbPassword} ${config.dbName} > ${dumpFile}`);
      const remotePath = `${config.remoteBackupPath}pfadump.sql`;
      await this.sshBackup.copyFile(dumpFile, remotePath);
      this.logger.log(`DB backup completed → ${remotePath}`);
    } catch (err) {
      this.logger.error(`mysqlDump failed: ${(err as Error).message}`);
    }
  }
}
