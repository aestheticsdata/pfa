import type { CatalogItem, CreatedSpending } from "@apps/pfa/interfaces/pfaTypes";
import type { BotMemory } from "@core/interfaces/actionTypes";

const LAST_SPENDING = "lastSpending";
const UPLOAD_TIMES = "uploadTimes";
/** Read by the core's bot snapshot (`uploads` column of the back-office). */
const UPLOAD_COUNT = "uploads";
const BILLS_PAID = "billsPaid";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const monthKey = (label: string, date: string) => `${label}@${date.slice(0, 7)}`;

/** Whether a monthly bill was already entered for the month of `date`. */
export function billPaid(memory: BotMemory, item: CatalogItem, date: string): boolean {
  return ((memory.get(BILLS_PAID) as Set<string> | undefined) ?? new Set()).has(monthKey(item.label, date));
}

export function rememberBill(memory: BotMemory, item: CatalogItem, date: string): void {
  const paid = (memory.get(BILLS_PAID) as Set<string> | undefined) ?? new Set<string>();
  paid.add(monthKey(item.label, date));
  memory.set(BILLS_PAID, paid);
}

export function lastSpending(memory: BotMemory): CreatedSpending | undefined {
  return memory.get(LAST_SPENDING) as CreatedSpending | undefined;
}

export function rememberSpending(memory: BotMemory, spending: CreatedSpending): void {
  memory.set(LAST_SPENDING, spending);
}

export function uploadsInLastWeek(memory: BotMemory, now: Date): number {
  const times = (memory.get(UPLOAD_TIMES) as number[] | undefined) ?? [];
  return times.filter((time) => time > now.getTime() - WEEK_MS).length;
}

export function rememberUpload(memory: BotMemory, now: Date): void {
  const times = ((memory.get(UPLOAD_TIMES) as number[] | undefined) ?? []).filter(
    (time) => time > now.getTime() - WEEK_MS,
  );
  memory.set(UPLOAD_TIMES, [...times, now.getTime()]);
  memory.set(UPLOAD_COUNT, Number(memory.get(UPLOAD_COUNT) ?? 0) + 1);
}
