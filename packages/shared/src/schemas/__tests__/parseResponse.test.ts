import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { parseResponse } from "#schemas/parseResponse";

const onDrift = vi.fn();
const CONTEXT = { endpoint: "/spendings", onDrift };

/** A drift is handed to the reporter — endpoint, codes, redacted paths — and the query still errors (PFA-177). */
const SCHEMA = z.object({
  items: z.array(z.object({ label: z.string(), amount: z.number() })),
  totals: z.record(z.string(), z.number()),
});

describe("parseResponse", () => {
  beforeEach(() => {
    onDrift.mockClear();
  });

  it("returns the parsed data and reports nothing when the response matches", () => {
    const data = { items: [{ label: "Bakery", amount: 3 }], totals: {} };
    expect(parseResponse(SCHEMA, data, CONTEXT)).toEqual(data);
    expect(onDrift).not.toHaveBeenCalled();
  });

  it("throws as `.parse()` did, after reporting the drift", () => {
    const data = { items: [{ label: "Bakery", amount: "3" }], totals: { Groceries: "12" } };

    expect(() => parseResponse(SCHEMA, data, CONTEXT)).toThrow(z.ZodError);
    expect(onDrift).toHaveBeenCalledOnce();
    expect(onDrift.mock.calls[0]?.[0]).toEqual({
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

    expect(() => parseResponse(SCHEMA, data, CONTEXT)).toThrow();
    const sent = JSON.stringify(onDrift.mock.calls[0]?.[0]);
    for (const value of ["42", "1234.56", "Private name", "secret"]) {
      expect(sent).not.toContain(value);
    }
  });

  it("still throws when nobody listens for drifts", () => {
    expect(() => parseResponse(SCHEMA, { items: "nope", totals: {} }, { endpoint: "/spendings" })).toThrow(z.ZodError);
  });
});
