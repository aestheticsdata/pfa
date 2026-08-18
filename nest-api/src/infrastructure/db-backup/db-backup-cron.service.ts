import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { exec } from "child_process";
import { mkdir, stat } from "fs/promises";
import { join } from "path";
import { promisify } from "util";
import { SshBackupService } from "@infrastructure/ssh-backup/ssh-backup.service";
import { withZeusReport } from "@infrastructure/zeus-report";
import type { DbBackupConfig } from "@config/db-backup.config";
import type { ZeusCronOutcome } from "@infrastructure/zeus-report";

const execAsync = promisify(exec);

/**
 * Six fields, seconds first — `@nestjs/schedule`'s own form. Declared once because Zeus is told the
 * same string the scheduler runs on, and the two drifting apart is exactly how a healthy job starts
 * being reported as late.
 */
const BACKUP_SCHEDULE = "0 0 */12 * * *";

/** The slug this job reports under. Stable: it is the identity of the row on Zeus's `/cron`. */
const BACKUP_CRON_KEY = "db-backup";

/** Config value → the environment variable an operator would have to go and set (COS-422). */
const REQUIRED_CONFIG: ReadonlyArray<[keyof DbBackupConfig, string]> = [
  ["dbUser", "DB_USER"],
  ["dbPassword", "DB_PASSWORD"],
  ["dbName", "DB"],
  ["dumpPath", "PFA_DUMP_PATH"],
  ["remoteBackupPath", "PFA_BACKUP_SERVER_PATH"],
];

/** Zeus caps a summary at 200 characters and rejects anything longer outright. */
const MAX_SUMMARY = 200;

@Injectable()
export class DbBackupCronService {
  private readonly logger = new Logger(DbBackupCronService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly sshBackup: SshBackupService,
  ) {}

  /**
   * Dumps the database and copies it to the backup VPS, twice a day — and tells Zeus what happened
   * (COS-422).
   *
   * Before the report, this job had two failure modes that were indistinguishable from success
   * anywhere outside pm2's log: a `mysqldump` that had been erroring for weeks, and a deploy that
   * dropped one environment variable so nothing ran at all. Both now show up on Zeus's `/cron` —
   * the first as `failed`, the second as `skipped` naming the missing key — and if the job stops
   * firing altogether, the schedule reported alongside it is what lets Zeus flag it overdue.
   */
  @Cron(BACKUP_SCHEDULE)
  async handleDbBackup(): Promise<void> {
    await withZeusReport(BACKUP_CRON_KEY, BACKUP_SCHEDULE, () => this.runBackup());
  }

  /**
   * No `timezone` is reported, deliberately: the `@Cron` above pins none, so it fires in the
   * process's own zone — UTC on ks-b — which is what Zeus reads a schedule in by default. Naming
   * `Europe/Paris` here would have it expect every run two hours early in summer.
   */
  private async runBackup(): Promise<ZeusCronOutcome> {
    const config = this.configService.get<DbBackupConfig>("dbBackup");

    if (!config?.enabled || !this.sshBackup.enabled) {
      return { status: "skipped", summary: "backups are disabled in this environment" };
    }

    const missing = REQUIRED_CONFIG.filter(([key]) => !config[key]).map(([, variable]) => variable);
    if (missing.length > 0) {
      this.logger.warn(`DB backup skipped: missing config (${missing.join(", ")})`);
      // Named rather than counted. A report saying "missing config" sends the reader back to the
      // source to find out which one; this one is actionable on its own.
      return { status: "skipped", summary: `missing config: ${missing.join(", ")}` };
    }

    this.logger.log("mysqlDump started");

    const dumpFile = join(config.dumpPath, "pfadump.sql");
    const remotePath = `${config.remoteBackupPath}pfadump.sql`;

    try {
      await mkdir(config.dumpPath, { recursive: true });
      await execAsync(`mysqldump -u${config.dbUser} -p${config.dbPassword} ${config.dbName} > ${dumpFile}`);
      // The size is the one number worth carrying: a dump that succeeds and shrinks by an order of
      // magnitude is a broken backup that looks exactly like a working one.
      const { size } = await stat(dumpFile);
      await this.sshBackup.copyFile(dumpFile, remotePath);
      this.logger.log(`DB backup completed → ${remotePath}`);

      return { summary: `dumped to ${remotePath}`, detail: { bytes: size } };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.error(`mysqlDump failed: ${message}`);

      // Reported as `failed` rather than rethrown. The wrapper would report and rethrow, and the
      // throw would land in `@nestjs/schedule` as an unhandled rejection — this job swallowed its
      // errors before COS-422 and continues to, so adding the report changes what is *visible*
      // without changing what the scheduler does.
      return { status: "failed", summary: message.slice(0, MAX_SUMMARY) };
    }
  }
}
