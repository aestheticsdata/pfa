"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import parseISO from "date-fns/parseISO";
import formatISO from "date-fns/formatISO";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import useSpendings from "@components/spendings/services/useSpendings";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { MONTHLY } from "@components/spendings/spendingDashboard/common/widgetHeaderConstants";
import texts from "@components/spendings/config/text";
import { DASHBOARD_PATH, DATE_QUERY_PARAM } from "@helpers/dateRoute";

import type { CategoryProps } from "@src/interfaces/category";
import type { SpendingItem } from "@components/spendings/types";

interface SpendingsListModalProps {
  handleClickOutside: () => void;
  periodType: string;
  categoryInfos: CategoryProps;
  total: number;
}

const groupByDate = (
  spendings: SpendingItem[],
): Record<string, SpendingItem[]> => {
  return spendings.reduce(
    (acc: Record<string, SpendingItem[]>, curr) => {
      if (!acc[curr.date]) acc[curr.date] = [];
      acc[curr.date].push(curr);
      return acc;
    },
    {},
  );
};

const SpendingsListModal = ({
  handleClickOutside: handleClickOutsideProp,
  periodType,
  categoryInfos,
  total,
}: SpendingsListModalProps) => {
  const [open, setOpen] = useState(true);
  const handleClickOutside = () => {
    setOpen(false);
    setTimeout(handleClickOutsideProp, 200);
  };
  const { spendingsByWeek, spendingsByMonth } = useSpendings();
  const { from, to } = useDatePickerWrapperStore();
  const [searchTerm, setSearchTerm] = useState("");
  const { spendingsListModal: spendingsListModalTexts } = texts;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const normalizedSearchTerm = searchTerm.toLowerCase();
  const categoryColor = categoryInfos?.categoryColor ?? "#94a3b8";

  const normalizePath = (path: string): string => {
    const normalized = path.replace(/\/+$/, "");
    return normalized === "" ? "/" : normalized;
  };

  const sourceItems: SpendingItem[] = (
    periodType === MONTHLY
      ? (spendingsByMonth ?? [])
      : (spendingsByWeek ?? []).flatMap((g) => g.items)
  ).filter(
    (s) =>
      s.category === categoryInfos.category &&
      s.label.toLowerCase().includes(normalizedSearchTerm),
  );

  const grouped = groupByDate(sourceItems);
  const groupedEntries = Object.entries(grouped);

  const cumulativeAt = (idx: number): number =>
    groupedEntries
      .slice(0, idx + 1)
      .reduce(
        (acc, [, items]) =>
          acc + items.reduce((a, s) => a + Number(s.amount), 0),
        0,
      );

  const dayTotal = (items: SpendingItem[]) =>
    items.reduce((acc, s) => acc + Number(s.amount), 0);

  const periodLabel =
    from && to
      ? periodType === MONTHLY
        ? format(from, "MMMM yyyy", { locale: fr }).toUpperCase()
        : `${format(from, "dd MMM yyyy", { locale: fr })} — ${format(
            to,
            "dd MMM yyyy",
            { locale: fr },
          )}`.toUpperCase()
      : "";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClickOutside()}>
      <DialogContent className="bg-gradient-to-br from-[#121212] via-[#0a0a0a] to-black border-gray-800 sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-5 border-b border-gray-800/60 space-y-0">
          <DialogTitle className="flex items-baseline gap-4 text-gray-100 flex-wrap pr-10">
            <span
              className="w-6 h-6 rounded shrink-0 self-center"
              style={{ backgroundColor: categoryColor }}
            />
            <span className="text-lg font-medium">
              {categoryInfos.category ??
                spendingsListModalTexts.noCategoryLabel}
            </span>
            <span className="text-sm uppercase tracking-wider text-gray-400 font-normal">
              Total :{" "}
              <span className="text-gray-100 font-bold normal-case text-base">
                {total.toFixed(2)} €
              </span>
            </span>
            {periodLabel && (
              <span className="text-sm uppercase tracking-wider text-gray-400 font-medium ml-auto">
                {periodLabel}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800/60">
          <Label className="text-gray-400 text-sm shrink-0">
            {spendingsListModalTexts.filter} :
          </Label>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher..."
            className="flex-1 bg-[#0c0c0c] border-gray-700/50 text-gray-200 placeholder:text-gray-500 focus-visible:border-cyan-500 focus-visible:ring-0"
          />
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-4 px-6 py-4">
          {groupedEntries.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-8">
              Aucune dépense pour cette catégorie.
            </div>
          )}
          {groupedEntries.map(([date, items], i) => {
            const dt = dayTotal(items);
            const cumulative = cumulativeAt(i);
            const pct = total > 0 ? (cumulative / total) * 100 : 0;
            const isClickable = periodType === MONTHLY;

            const headerInner = (
              <>
                <div className="text-gray-100 uppercase text-base font-bold tracking-wide">
                  {format(parseISO(date), "EEEE dd MMMM", { locale: fr })}
                </div>
                <div className="flex gap-3 items-start">
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-gray-400 text-xs">
                      {spendingsListModalTexts.dayTotal}
                    </span>
                    <span className="px-3 py-1.5 rounded-lg border border-gray-700/60 bg-[#1c1c1c] text-gray-100 text-sm font-bold tabular-nums shadow-inner">
                      {dt.toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-gray-400 text-xs">
                      {spendingsListModalTexts.cumulativeTotal}
                    </span>
                    <span className="px-3 py-1.5 rounded-lg border border-gray-700/60 bg-[#1c1c1c] text-gray-100 text-sm font-bold tabular-nums shadow-inner">
                      {cumulative.toFixed(2)} €
                    </span>
                    {periodType === MONTHLY && (
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: categoryColor }}
                      >
                        {pct.toFixed(0)}% du mois ({pct.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              </>
            );

            const onCardClick = () => {
              const dateISO = formatISO(new Date(date), {
                representation: "date",
              });
              const params = new URLSearchParams(searchParams.toString());
              params.set(DATE_QUERY_PARAM, dateISO);
              if (normalizePath(pathname) === DASHBOARD_PATH) {
                router.push(`${DASHBOARD_PATH}?${params.toString()}`);
              } else {
                router.push(
                  `${DASHBOARD_PATH}?${DATE_QUERY_PARAM}=${dateISO}`,
                );
              }
              handleClickOutside();
            };

            const Wrapper = isClickable ? "button" : "div";
            const wrapperProps = isClickable
              ? {
                  type: "button" as const,
                  onClick: onCardClick,
                }
              : {};

            return (
              <Wrapper
                key={date}
                {...wrapperProps}
                className={`group block w-full shrink-0 text-left bg-[#0c0c0c] rounded-xl border border-gray-800/50 overflow-hidden transition-colors ${
                  isClickable
                    ? "hover:border-cyan-400 cursor-pointer"
                    : ""
                }`}
              >
                <div
                  className={`flex items-start justify-between gap-4 px-5 py-4 transition-colors ${
                    isClickable ? "group-hover:bg-gray-800/30" : ""
                  }`}
                >
                  {headerInner}
                </div>

                <div
                  className={`flex flex-col px-5 py-3 gap-2.5 border-t border-gray-800/40 bg-[#141414] transition-colors ${
                    isClickable ? "group-hover:bg-[#1a1a1a]" : ""
                  }`}
                >
                  {items.map((spending) => (
                    <div
                      key={spending.ID}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2.5 text-gray-200">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: categoryColor }}
                        />
                        <span>{spending.label}</span>
                      </div>
                      <span className="text-gray-100 tabular-nums">
                        {Number(spending.amount).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
              </Wrapper>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpendingsListModal;
