"use client";

import { useMemo } from "react";
import format from "date-fns/format";
import parseISO from "date-fns/parseISO";
import { fr } from "date-fns/locale";
import ExceptionalItem from "@components/exceptionals/ExceptionalItem";

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
    return (
      <div className="text-center text-gray-500 text-sm py-12">
        Aucune dépense exceptionnelle.
      </div>
    );
  }

  const fmt = (v: number) =>
    v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.key} className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300 lowercase first-letter:uppercase">
              {group.label}
            </span>
            <span className="text-gray-400 tabular-nums">
              Total: {fmt(group.total)} €
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {group.items.map((item) => (
              <ExceptionalItem
                key={item.ID}
                item={item}
                onEdit={onEdit}
                monthlyAverage={monthlyAverage}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExceptionalsList;
