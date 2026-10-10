import { glob, open, stat } from "node:fs/promises";
import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from "@nestjs/common";
import { AppsService } from "#app/apps/apps.service.js";
import { parseAlertLine } from "#app/incidents/alert-line.js";
import { IncidentsService } from "#app/incidents/incidents.service.js";
import { PrismaService } from "#app/prisma/prisma.service.js";

import type { FileCursor, LogRange, LogTarget } from "#app/incidents/interfaces/incidentTypes.js";

const POLL_MS = 5_000;
/** Read at most this much per file per poll: a flood is caught up over a few polls, not in one gulp. */
const MAX_READ_BYTES = 4 * 1024 * 1024;

/**
 * Tails each app's log files (a glob: PM2 names them `<app>-out-<id>.log` and the id changes) for
 * `synthetic-foreign-ip` lines, and turns them into incidents. Where it stopped is stored per file,
 * so a restart neither replays old alerts nor misses new ones; a file never seen before is read
 * from its end — the back-office raises what happens from now on, not the past's test lines.
 */
@Injectable()
export class AlertLogWatcherService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(AlertLogWatcherService.name);
  private timer: NodeJS.Timeout | undefined;
  private polling = false;

  constructor(
    private readonly apps: AppsService,
    private readonly incidents: IncidentsService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    if (this.apps.list().some((app) => app.alertLogs)) {
      this.timer = setInterval(() => void this.poll(), POLL_MS);
    }
  }

  onApplicationShutdown(): void {
    clearInterval(this.timer);
  }

  /** One pass over every app's files. Public for tests; never overlaps itself. */
  async poll(): Promise<void> {
    if (this.polling) return;
    this.polling = true;
    try {
      for (const app of this.apps.list()) {
        if (!app.alertLogs) continue;
        for await (const file of glob(app.alertLogs)) {
          await this.readFile({ app: app.id, file });
        }
      }
    } catch (error) {
      this.logger.error(`alert log poll failed: ${String(error)}`);
    } finally {
      this.polling = false;
    }
  }

  private async readFile(target: LogTarget): Promise<void> {
    const info = await stat(target.file);
    const inode = String(info.ino);
    const saved = await this.prisma.logCursor.findUnique({ where: { file: target.file } });
    const cursor: FileCursor = saved
      ? { inode: saved.inode, offset: Number(saved.offset) }
      : { inode, offset: info.size };
    // Rotated (new file under the same name) or truncated: start over from the top.
    if (cursor.inode !== inode || info.size < cursor.offset) {
      cursor.inode = inode;
      cursor.offset = 0;
    }
    if (info.size > cursor.offset) {
      cursor.offset = await this.readFrom({ ...target, from: cursor.offset, size: info.size });
    }
    await this.prisma.logCursor.upsert({
      where: { file: target.file },
      create: { file: target.file, inode: cursor.inode, offset: BigInt(cursor.offset) },
      update: { inode: cursor.inode, offset: BigInt(cursor.offset) },
    });
  }

  /** Reads whole lines from `from`; returns where the next read starts (after the last newline). */
  private async readFrom(range: LogRange): Promise<number> {
    const length = Math.min(range.size - range.from, MAX_READ_BYTES);
    const handle = await open(range.file, "r");
    try {
      const buffer = Buffer.alloc(length);
      await handle.read(buffer, 0, length, range.from);
      const lastNewline = buffer.lastIndexOf(0x0a);
      if (lastNewline < 0) return range.from;
      for (const line of buffer.subarray(0, lastNewline).toString("utf8").split("\n")) {
        const alert = parseAlertLine(line);
        if (alert) await this.incidents.record({ app: range.app, alert });
      }
      return range.from + lastNewline + 1;
    } finally {
      await handle.close();
    }
  }
}
