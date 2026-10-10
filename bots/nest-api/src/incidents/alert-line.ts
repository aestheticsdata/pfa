import type { AlertLine } from "#app/incidents/interfaces/incidentTypes.js";

const ALERT_ACTION = "synthetic-foreign-ip";

/**
 * Reads one log line; returns the alert it carries, or null for anything else (most lines). The
 * line is ECS JSON from pino; non-JSON lines (PM2 notices, stack traces) are simply not alerts.
 */
export function parseAlertLine(line: string): AlertLine | null {
  if (!line.includes(ALERT_ACTION)) {
    return null;
  }
  let record: Record<string, unknown>;
  try {
    record = JSON.parse(line) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (record["event.action"] !== ALERT_ACTION) {
    return null;
  }
  const text = (key: string): string | null => {
    const value = record[key];
    return typeof value === "string" && value.length > 0 ? value : null;
  };
  const ip = text("client.ip");
  const email = text("user.name");
  const userId = text("user.id");
  const account = email?.toLowerCase() ?? (userId ? `user:${userId}` : null);
  if (!ip || !account) {
    return null;
  }
  const stamp = text("@timestamp");
  const at = stamp ? new Date(stamp) : new Date();
  return {
    account: account.slice(0, 250),
    userId,
    ip: ip.slice(0, 45),
    userAgent: text("user_agent.original")?.slice(0, 255) ?? null,
    path: text("url.path")?.slice(0, 255) ?? null,
    at: Number.isNaN(at.getTime()) ? new Date() : at,
  };
}
