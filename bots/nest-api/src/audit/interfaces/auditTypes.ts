import type { AuditStatus } from "#prisma-client/enums.js";

/** Who did it, and from where. */
export interface AuditActor {
  email: string;
  ip: string | null;
  userAgent: string | null;
}

export interface AuditRecord {
  actor: AuditActor;
  /** Dotted verb: `auth.signin`, `runner.stop`, `bot.toggle`, `account.disable`… */
  action: string;
  status: AuditStatus;
  targetApp?: string;
  target?: string;
  detail?: string;
}
