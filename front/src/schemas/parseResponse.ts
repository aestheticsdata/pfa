import { redactIssuePath } from "@lib/redactIssuePath";
import { report } from "@lib/report";

import type { z } from "zod";

/** Enough to locate a drift; a payload rejected wholesale would otherwise send one line per row. */
const MAX_REPORTED_ISSUES = 10;

/**
 * Parses an API response, and turns a contract drift into a signal (PFA-177).
 *
 * A response that no longer matches its schema still throws — the query errors exactly as it did
 * with a bare `.parse()`, so the UI has no new path. What changes is that the failure is reported
 * to Iknos first: the endpoint, and for each issue its code, zod's message and a redacted path.
 * Never the payload, nor any value from it: it is the user's financial data.
 *
 * `endpoint` is the route without its query string, which carries IDs and dates.
 */
export const parseResponse = <Schema extends z.ZodType>(schema: Schema, data: unknown, endpoint: string) => {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  report({
    message: `API contract drift on ${endpoint}`,
    api_contract: {
      endpoint,
      issues: result.error.issues.slice(0, MAX_REPORTED_ISSUES).map((issue) => ({
        path: redactIssuePath(schema, issue.path).join("."),
        code: issue.code,
        message: issue.message,
      })),
      issue_count: result.error.issues.length,
    },
  });

  throw result.error;
};
