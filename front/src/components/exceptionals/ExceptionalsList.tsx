"use client";

import ExceptionalItem from "@components/exceptionals/ExceptionalItem";
import format from "date-fns/format";
import { fr } from "date-fns/locale";
import parseISO from "date-fns/parseISO";
import { useMemo } from "react";

import type { ExceptionalItem as ExceptionalItemType } from "@src/schemas/exceptionals";

interface MonthGroup {
  key: string;
  label: string;
  total: number;
  items: ExceptionalItemType[];
}

interface ExceptionalsListProps {
  items: ExceptionalItemType[];
  onEdit: (item: ExceptionalItemType) => void;
  monthlyAverage: number;
}

const fmt = (v: number) =>
  v.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const ExceptionalsList = ({ items, onEdit, monthlyAverage }: ExceptionalsListProps) => {
  const groups = useMemo<MonthGroup[]>(() => {
    const map = new Map<string, MonthGroup>();
    for (const item of items) {
      const date = parseISO(item.date);
      const key = format(date, "yyyy-MM");
      const label = format(date, "MMMM yyyy", { locale: fr });
      let group = map.get(key);
      if (!group) {
        group = { key, label, total: 0, items: [] };
        map.set(key, group);
      }
      group.items.push(item);
      group.total += Number(item.amount);
    }
    return Array.from(map.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [items]);

  if (groups.length === 0) {
    return <div className="py-12 text-center text-[12.5px] text-ink-4">Aucun achat exceptionnel.</div>;
  }

  return (
    <div className="flex flex-col gap-[18px]">
      {groups.map((group) => (
        <section key={group.key}>
          <div className="flex items-baseline justify-between px-1 pb-2.5">
            <h2 className="text-[15px] font-semibold capitalize tracking-[-0.01em] text-ink">
              {group.label}
              <span className="ml-2 text-xs font-normal text-ink-4">
                · {group.items.length} achat
                {group.items.length > 1 ? "s" : ""}
              </span>
            </h2>
            <span className="num text-sm text-ink-2">
              Total <b className="font-medium text-ink">{fmt(group.total)} €</b>
            </span>
          </div>
          <div className="overflow-hidden rounded-[14px] border border-line-soft bg-surface-elev">
            {group.items.map((item) => (
              <ExceptionalItem
                key={item.ID}
                item={item}
                onEdit={onEdit}
                monthlyAverage={monthlyAverage}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ExceptionalsList;
