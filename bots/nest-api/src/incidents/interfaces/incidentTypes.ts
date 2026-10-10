import type { IncidentStatus } from "#prisma-client/enums.js";

/** One `synthetic-foreign-ip` line, as read from an app's log (PFA-122's `SyntheticIpGuard`). */
export interface AlertLine {
  /** The bot's email when the line names one, else `user:<id>`. */
  account: string;
  userId: string | null;
  ip: string;
  userAgent: string | null;
  path: string | null;
  at: Date;
}

/** An alert line, attributed to the app whose log it came from. */
export interface AppAlert {
  app: string;
  alert: AlertLine;
}

/** Where a log file has been read up to. */
export interface FileCursor {
  inode: string;
  offset: number;
}

/** The account an incident is closed with, and how. */
export interface AccountResolution {
  app: string;
  account: string;
  status: typeof IncidentStatus.disabled | typeof IncidentStatus.purged;
}

/** One app's log file. */
export interface LogTarget {
  app: string;
  file: string;
}

/** The unread part of a log file. */
export interface LogRange extends LogTarget {
  from: number;
  size: number;
}
