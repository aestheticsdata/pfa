// The DTO decorators write their metadata through Reflect — Nest loads this in
// main.ts, a bare unit spec has to do it itself.
import "reflect-metadata";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { FIELD_LIMITS } from "@config/field-limits";
import { CreateSpendingDto } from "../spendings/dto/create-spending.dto";
import { UpdateSpendingDto } from "../spendings/dto/update-spending.dto";
import { CreateSpendingCategoryDto } from "../spendings/dto/create-spending-category.dto";
import { UpdateCategoryDto } from "../categories/dto/update-category.dto";
import { CreateRecurringDto } from "../recurrings/dto/create-recurring.dto";
import { UpdateRecurringDto } from "../recurrings/dto/update-recurring.dto";
import { CreateExceptionalDto } from "../exceptionals/dto/create-exceptional.dto";
import { UpdateExceptionalDto } from "../exceptionals/dto/update-exceptional.dto";
import { AddUserDto } from "../users/dto/add-user.dto";
import { SignInDto } from "../users/dto/sign-in.dto";

/**
 * COS-180 — every user-writable text field is bounded on the width of the column
 * it lands in, so an oversized input is refused by validation instead of blowing
 * up as a raw SQL error at insert time.
 *
 * Two guards: the constants still match `schema.prisma`, and each DTO field
 * actually carries the bound.
 */
describe("FIELD_LIMITS", () => {
  const schema = readFileSync(join(__dirname, "..", "..", "prisma", "schema.prisma"), "utf8");

  /** Width of a model's `@db.VarChar(n)` column, read straight from the schema. */
  const columnWidth = (model: string, column: string): number | null => {
    const block = new RegExp(`model ${model} \\{([\\s\\S]*?)\\n\\}`).exec(schema)?.[1];
    if (!block) return null;
    const line = new RegExp(`^\\s*${column}\\s+\\S+\\s.*@db\\.VarChar\\((\\d+)\\)`, "m").exec(block);
    return line ? Number(line[1]) : null;
  };

  it.each([
    ["label", "Spendings", "label"],
    ["label", "Recurrings", "label"],
    ["description", "Exceptionals", "description"],
    ["categoryName", "Categories", "name"],
    ["exceptionalCategoryName", "Exceptionals", "categoryName"],
    ["color", "Categories", "color"],
    ["color", "Exceptionals", "categoryColor"],
    ["userName", "Users", "name"],
    ["email", "Users", "email"],
    ["currency", "Spendings", "currency"],
    ["currency", "Users", "baseCurrency"],
    ["language", "Users", "language"],
  ])("%s mirrors %s.%s in schema.prisma", (limit, model, column) => {
    expect(columnWidth(model, column)).toBe(FIELD_LIMITS[limit as keyof typeof FIELD_LIMITS]);
  });
});

describe("DTO length bounds", () => {
  /**
   * A syntactically valid email of exactly `length` chars, so the case isolates
   * the length bound: `@IsEmail` caps the local part at 64 and each domain label
   * at 63, hence a short local part and a domain split into 60-char labels.
   */
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

  const spending = { date: "2026-07-01", label: "Courses", amount: 12.5, currency: "EUR" };
  const recurring = { start: "2026-07-01", end: "2026-07-31", label: "Loyer", amount: 900, currency: "EUR" };
  const exceptional = {
    date: "2026-07-01",
    label: "Réparation",
    description: "Garage",
    amount: 320,
    currency: "EUR",
    categoryName: "auto",
    categoryColor: "#84c4f5",
  };
  const user = { name: "someone", email: "someone@example.com", password: "hunter2", baseCurrency: "EUR" };
  const signIn = { email: "someone@example.com", password: "hunter2" };
  const category = { name: "courses", color: "#84c4f5" };

  // Object rows, not tuples: with a tuple shorter than the callback's parameter
  // list, jest fills the gap with its `done` callback instead of `undefined`.
  interface Case {
    Dto: new () => object;
    base: Record<string, unknown>;
    field: string;
    max: number;
    /** How to build a value of a given length, when "xxx…" would not validate. */
    build?: (length: number) => string;
  }

  const cases: Case[] = [
    { Dto: CreateSpendingDto, base: spending, field: "label", max: FIELD_LIMITS.label },
    { Dto: CreateSpendingDto, base: spending, field: "currency", max: FIELD_LIMITS.currency },
    { Dto: UpdateSpendingDto, base: spending, field: "label", max: FIELD_LIMITS.label },
    { Dto: CreateSpendingCategoryDto, base: { name: "courses" }, field: "name", max: FIELD_LIMITS.categoryName },
    { Dto: CreateSpendingCategoryDto, base: { name: "courses" }, field: "color", max: FIELD_LIMITS.color },
    { Dto: UpdateCategoryDto, base: category, field: "name", max: FIELD_LIMITS.categoryName },
    { Dto: UpdateCategoryDto, base: category, field: "color", max: FIELD_LIMITS.color },
    { Dto: CreateRecurringDto, base: recurring, field: "label", max: FIELD_LIMITS.label },
    { Dto: CreateRecurringDto, base: recurring, field: "currency", max: FIELD_LIMITS.currency },
    { Dto: UpdateRecurringDto, base: recurring, field: "label", max: FIELD_LIMITS.label },
    { Dto: CreateExceptionalDto, base: exceptional, field: "label", max: FIELD_LIMITS.label },
    { Dto: CreateExceptionalDto, base: exceptional, field: "description", max: FIELD_LIMITS.description },
    {
      Dto: CreateExceptionalDto,
      base: exceptional,
      field: "categoryName",
      max: FIELD_LIMITS.exceptionalCategoryName,
    },
    { Dto: CreateExceptionalDto, base: exceptional, field: "categoryColor", max: FIELD_LIMITS.color },
    { Dto: UpdateExceptionalDto, base: exceptional, field: "label", max: FIELD_LIMITS.label },
    { Dto: UpdateExceptionalDto, base: exceptional, field: "description", max: FIELD_LIMITS.description },
    {
      Dto: UpdateExceptionalDto,
      base: exceptional,
      field: "categoryName",
      max: FIELD_LIMITS.exceptionalCategoryName,
    },
    { Dto: AddUserDto, base: user, field: "name", max: FIELD_LIMITS.userName },
    { Dto: AddUserDto, base: user, field: "email", max: FIELD_LIMITS.email, build: email },
    { Dto: AddUserDto, base: user, field: "baseCurrency", max: FIELD_LIMITS.currency },
    { Dto: SignInDto, base: signIn, field: "email", max: FIELD_LIMITS.email, build: email },
  ];

  const errorsFor = async (Dto: new () => object, payload: Record<string, unknown>, property: string) => {
    const errors = await validate(plainToInstance(Dto, payload));
    return errors.filter((error) => error.property === property);
  };

  const valueOf = ({ build }: Case, length: number) => (build ?? ((n: number) => "x".repeat(n)))(length);

  it.each(cases)("$Dto.name — $field accepts exactly $max characters", async (testCase) => {
    const { Dto, base, field, max } = testCase;

    expect(await errorsFor(Dto, { ...base, [field]: valueOf(testCase, max) }, field)).toEqual([]);
  });

  it.each(cases)("$Dto.name — $field rejects one character over $max", async (testCase) => {
    const { Dto, base, field, max } = testCase;

    const errors = await errorsFor(Dto, { ...base, [field]: valueOf(testCase, max + 1) }, field);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty("maxLength");
  });
});
