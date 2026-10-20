// The DTO decorators write their metadata through Reflect — Nest loads this in
// main.ts, a bare unit spec has to do it itself.
import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import type { ClassConstructor } from "class-transformer";
import { validate } from "class-validator";
import { DashboardQueryDto } from "../dashboard/dto/dashboard-query.dto";
import { RecurringsQueryDto } from "../recurrings/dto/recurrings-query.dto";
import { SpendingsQueryDto } from "../spendings/dto/spendings-query.dto";
import { MonthlyStatsQueryDto } from "../stats/dto/monthly-stats-query.dto";
import { WeeklyStatsQueryDto } from "../stats/dto/weekly-stats-query.dto";

/**
 * PFA-239 — the month-scoped reads take yyyy-MM-dd dates only. They used to accept a
 * Date's toString, which reached the right day only because the query parser turned
 * "GMT+0200" into "GMT 0200"; anything else is now a 400.
 */
interface DateQueryCase {
  dto: ClassConstructor<object>;
  fields: string[];
}

const CASES: DateQueryCase[] = [
  { dto: DashboardQueryDto, fields: ["start"] },
  { dto: RecurringsQueryDto, fields: ["start"] },
  { dto: SpendingsQueryDto, fields: ["from", "to"] },
  { dto: MonthlyStatsQueryDto, fields: ["from"] },
  { dto: WeeklyStatsQueryDto, fields: ["start"] },
];

const errorsFor = async (dto: ClassConstructor<object>, value: string, fields: string[]) => {
  const input = Object.fromEntries(fields.map((field) => [field, value]));
  return validate(plainToInstance(dto, input));
};

describe("month-scoped date queries (PFA-239)", () => {
  it.each(CASES)("$dto.name accepts yyyy-MM-dd", async ({ dto, fields }) => {
    expect(await errorsFor(dto, "2026-10-01", fields)).toHaveLength(0);
  });

  it.each(CASES)("$dto.name refuses a Date's toString", async ({ dto, fields }) => {
    const errors = await errorsFor(dto, "Thu Oct 01 2026 00:00:00 GMT 0200 (Central European Summer Time)", fields);
    expect(errors.map((e) => e.property).sort()).toEqual([...fields].sort());
  });

  it.each(CASES)("$dto.name refuses a missing date", async ({ dto, fields }) => {
    expect(await validate(plainToInstance(dto, {}))).toHaveLength(fields.length);
  });
});
