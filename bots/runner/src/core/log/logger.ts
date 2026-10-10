import type { LogFields } from "@core/interfaces/logTypes";

/**
 * JSON lines on stdout (PM2 collects them). Passwords and tokens never reach this function: the
 * fields are whatever a caller passes, so callers only pass ids, emails, actions and statuses.
 */
function write(level: string, message: string, fields: LogFields = {}): void {
  process.stdout.write(`${JSON.stringify({ time: new Date().toISOString(), level, message, ...fields })}\n`);
}

export const logger = {
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) => write("error", message, fields),
};
