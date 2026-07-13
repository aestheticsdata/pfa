import getMonth from "date-fns/getMonth";
import parseISO from "date-fns/parseISO";

import type { ExceptionalItem } from "@src/schemas/exceptionals";

/** 12-slot array (Jan→Dec) of exceptional spend per month. */
export const exceptionalMonthly = (items: ExceptionalItem[]): number[] => {
  const out = Array<number>(12).fill(0);
  items.forEach((item) => {
    const month = getMonth(parseISO(item.date));
    if (month >= 0 && month < 12) out[month] += Number(item.amount) || 0;
  });
  return out;
};

export const exceptionalTotal = (items: ExceptionalItem[]): number =>
  items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

/** The single largest exceptional purchase, or null when there are none. */
export const biggestExceptional = (items: ExceptionalItem[]): ExceptionalItem | null =>
  items.reduce<ExceptionalItem | null>(
    (max, item) => (!max || Number(item.amount) > Number(max.amount) ? item : max),
    null,
  );
