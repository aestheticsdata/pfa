import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const report = vi.fn();
vi.mock("@lib/report", () => ({ report }));

const { parseResponse } = await import("@src/schemas/parseResponse");

/** A drift is reported to Iknos — endpoint, codes, redacted paths — and the query still errors (PFA-177). */
const SCHEMA = z.object({
  items: z.array(z.object({ label: z.string(), amount: z.number() })),
  totals: z.record(z.string(), z.number()),
});

describe("parseResponse", () => {
  beforeEach(() => {
    report.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the parsed data and reports nothing when the response matches", () => {
    const data = { items: [{ label: "Bakery", amount: 3 }], totals: {} };
    expect(parseResponse(SCHEMA, data, "/spendings")).toEqual(data);
    expect(report).not.toHaveBeenCalled();
  });

  it("throws as `.parse()` did, after reporting the drift", () => {
    const data = { items: [{ label: "Bakery", amount: "3" }], totals: { Groceries: "12" } };

    expect(() => parseResponse(SCHEMA, data, "/spendings")).toThrow(z.ZodError);
    expect(report).toHaveBeenCalledOnce();
    expect(report.mock.calls[0]?.[0]).toEqual({
      message: "API contract drift on /spendings",
      api_contract: {
        endpoint: "/spendings",
        issue_count: 2,
        issues: [
          { path: "items.0.amount", code: "invalid_type", message: "Invalid input: expected number, received string" },
          { path: "totals.<key>", code: "invalid_type", message: "Invalid input: expected number, received string" },
        ],
      },
    });
  });

  it("never sends a value from the payload", () => {
    const data = { items: [{ label: 42, amount: 1234.56 }], totals: { "Private name": "secret" } };

    expect(() => parseResponse(SCHEMA, data, "/spendings")).toThrow();
    const sent = JSON.stringify(report.mock.calls[0]?.[0]);
    for (const value of ["42", "1234.56", "Private name", "secret"]) {
      expect(sent).not.toContain(value);
    }
  });
});
