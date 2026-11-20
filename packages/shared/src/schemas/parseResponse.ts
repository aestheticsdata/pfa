import { redactIssuePath } from "#schemas/redactIssuePath";

import type { z } from "zod";
import type { ParseContext } from "#schemas/interfaces/parseTypes";

/** Enough to locate a drift; a payload rejected wholesale would otherwise send one line per row. */
const MAX_REPORTED_ISSUES = 10;

/**
 * Parses an API response, and turns a contract drift into a signal (PFA-177).
 *
 * A response that no longer matches its schema still throws, so the query errors exactly as it
 * would with a bare `.parse()`. Before that, the drift is handed to `context.onDrift` — the web
 * sends it to Iknos, the mobile app logs it: the endpoint, and for each issue its code, zod's
 * message and a redacted path. Never the payload, nor any value from it: it is the user's
 * financial data.
 *
 * `context.endpoint` is the route without its query string, which carries IDs and dates.
 */
export const parseResponse = <Schema extends z.ZodType>(schema: Schema, data: unknown, context: ParseContext) => {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  context.onDrift?.({
    message: `API contract drift on ${context.endpoint}`,
    api_contract: {
      endpoint: context.endpoint,
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
