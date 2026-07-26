import { makeExceptionalSchema } from "@components/exceptionals/schema";
import { makeLoginSchema } from "@components/shared/sharedLoginForm/schema";
import { makeSpendingSchema } from "@components/spendings/common/spendingModal/schema";
import { FIELD_LIMITS } from "@src/schemas/fieldLimits";
import { dictionaries } from "@text/index";

import type { ZodSafeParseResult } from "zod";

/**
 * COS-180 — every bounded form field refuses one character over its column width
 * and says so with the shared `common.validation.tooLong` message, instead of
 * letting the value reach MySQL and come back as a raw SQL error.
 *
 * The real FR dictionary is used on purpose: it checks the message the user
 * actually reads, not a stub.
 */
const { common, exceptionals, login, spendings } = dictionaries.fr;

const spendingSchema = makeSpendingSchema(spendings.modal.validation, common.validation);
const exceptionalSchema = makeExceptionalSchema(exceptionals.modal.errors, common.validation);
const loginSchema = makeLoginSchema(true, true, true, true, login.validation, common.validation);

const validSpending = { spendingLabel: "Courses", spendingAmount: "12", spendingDate: "2026-07-01" };
const validExceptional = { label: "Réparation", amount: "320", date: "2026-07-01", description: "Garage" };
const validLogin = { email: "someone@example.com", password: "hunter2", confirmPassword: "hunter2", currency: "EUR" };

const filler = (length: number) => "x".repeat(length);

/** A syntactically valid email of exactly `length` chars (long domain, short local part). */
const email = (length: number) => {
  const local = "a".repeat(60);
  const labels: string[] = [];
  let remaining = length - local.length - 1;
  while (remaining > 0) {
    const take = Math.min(60, remaining);
    labels.push("b".repeat(take));
    remaining -= take + 1;
  }
  return `${local}@${labels.join(".")}`;
};

const outcome = (result: ZodSafeParseResult<unknown>) => ({
  success: result.success,
  messages: result.success ? [] : result.error.issues.map((issue) => issue.message),
});

interface Case {
  name: string;
  max: number;
  build: (length: number) => string;
  check: (value: string) => { success: boolean; messages: string[] };
}

const cases: Case[] = [
  {
    name: "spending label",
    max: FIELD_LIMITS.label,
    build: filler,
    check: (value) => outcome(spendingSchema.safeParse({ ...validSpending, spendingLabel: value })),
  },
  {
    name: "exceptional label",
    max: FIELD_LIMITS.label,
    build: filler,
    check: (value) => outcome(exceptionalSchema.safeParse({ ...validExceptional, label: value })),
  },
  {
    name: "exceptional description",
    max: FIELD_LIMITS.description,
    build: filler,
    check: (value) => outcome(exceptionalSchema.safeParse({ ...validExceptional, description: value })),
  },
  {
    name: "signup email",
    max: FIELD_LIMITS.email,
    build: email,
    check: (value) => outcome(loginSchema.safeParse({ ...validLogin, email: value })),
  },
];

it.each(cases)("$name accepts exactly $max characters", ({ max, build, check }) => {
  expect(check(build(max))).toEqual({ success: true, messages: [] });
});

it.each(cases)("$name rejects one character over $max", ({ max, build, check }) => {
  const result = check(build(max + 1));

  expect(result.success).toBe(false);
  expect(result.messages).toContain(common.validation.tooLong(max));
});
