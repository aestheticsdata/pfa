import { randomUUID } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "#app/prisma/prisma.service.js";

import type { AuditRecord } from "#app/audit/interfaces/auditTypes.js";

const MAX_DETAIL_CHARS = 4000;

/** The back-office's own log: every sign-in attempt and every control action. Never pruned. */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Writes one row and never throws: an action that succeeded must not be reported as failed
   * because the log write failed afterwards. The gap still shows in the process log.
   */
  async record(entry: AuditRecord): Promise<void> {
    try {
      await this.prisma.auditEntry.create({
        data: {
          id: randomUUID(),
          actor: entry.actor.email.slice(0, 250),
          action: entry.action,
          status: entry.status,
          targetApp: entry.targetApp ?? null,
          target: entry.target?.slice(0, 250) ?? null,
          detail: entry.detail?.slice(0, MAX_DETAIL_CHARS) ?? null,
          ip: entry.actor.ip,
          userAgent: entry.actor.userAgent?.slice(0, 255) ?? null,
        },
      });
    } catch (error) {
      this.logger.error(`audit write failed for ${entry.action}: ${String(error)}`);
    }
  }
}
