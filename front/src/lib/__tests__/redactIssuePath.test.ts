import { REDACTED_KEY, redactIssuePath } from "@lib/redactIssuePath";
import { describe, expect, it } from "vitest";
import { z } from "zod";

/** Field names and indices stay; any key the user chose is redacted (PFA-177). */
describe("redactIssuePath", () => {
  it("keeps declared fields and indices", () => {
    const schema = z.object({ items: z.array(z.object({ amount: z.number() })) });
    expect(redactIssuePath(schema, ["items", 3, "amount"])).toEqual(["items", 3, "amount"]);
  });

  it("redacts record keys — category names, years", () => {
    const schema = z.object({ data: z.record(z.string(), z.array(z.record(z.string(), z.number()))) });
    expect(redactIssuePath(schema, ["data", "2026", 0, "Groceries"])).toEqual(["data", REDACTED_KEY, 0, REDACTED_KEY]);
  });

  it("sees through nullable, optional, default, preprocess and transform", () => {
    const row = z.record(z.string(), z.number()).transform((r) => r);
    const schema = z
      .object({
        expense: z.object({ label: z.string() }).nullable(),
        list: z.array(row).default([]),
        amount: z.preprocess((v) => v, z.object({ cents: z.number() })).optional(),
      })
      .nullable();
    expect(redactIssuePath(schema, ["expense", "label"])).toEqual(["expense", "label"]);
    expect(redactIssuePath(schema, ["list", 0, "Rent"])).toEqual(["list", 0, REDACTED_KEY]);
    expect(redactIssuePath(schema, ["amount", "cents"])).toEqual(["amount", "cents"]);
  });

  it("redacts a key the schema does not declare", () => {
    const schema = z.object({ ID: z.string() });
    expect(redactIssuePath(schema, ["Some label"])).toEqual([REDACTED_KEY]);
    expect(redactIssuePath(z.string(), ["anything", 2])).toEqual([REDACTED_KEY, 2]);
  });
});
