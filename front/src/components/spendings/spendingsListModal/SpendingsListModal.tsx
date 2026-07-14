"use client";

import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { DATE_FORMAT, MONTHLY } from "@components/spendings/config/constants";
import texts from "@components/spendings/config/text";
import useSpendings from "@components/spendings/services/useSpendings";
import { DATE_QUERY_PARAM, SPENDINGS_PATH } from "@helpers/dateRoute";
import { euro } from "@lib/format";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import parseISO from "date-fns/parseISO";
import { ChevronRight, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

import type { SpendingItem } from "@components/spendings/types";
import type { CategoryProps } from "@src/interfaces/category";

interface SpendingsListModalProps {
  handleClickOutside: () => void;
  periodType: string;
  categoryInfos: CategoryProps;
  total: number;
}

const FALLBACK_COLOR = "#94a3b8";

const groupByDate = (spendings: SpendingItem[]): Record<string, SpendingItem[]> => {
  return spendings.reduce((acc: Record<string, SpendingItem[]>, curr) => {
    if (!acc[curr.date]) acc[curr.date] = [];
    acc[curr.date].push(curr);
    return acc;
  }, {});
};

/**
 * "Détail catégorie" drill-down modal — shared by the Dashboard (monthly) and
 * Dépenses (weekly) "Répartition par catégorie" widgets. Lists the clicked
 * category's spendings grouped by day, with running cumulative totals. Each day
 * card links back to the week that contains it. Design: `.catd-*` (faithful
 * port of design_handoff_pfa/designs/assets/cat-detail.{js,css}).
 */
const SpendingsListModal = ({ handleClickOutside, periodType, categoryInfos, total }: SpendingsListModalProps) => {
  const { spendingsByWeek, spendingsByMonth } = useSpendings();
  const { from, to } = useDatePickerWrapperStore();
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { spendingsListModal: t } = texts;
  const isMonthly = periodType === MONTHLY;
  const pctWord = isMonthly ? t.monthWord : t.weekWord;
  const categoryColor = categoryInfos?.categoryColor ?? FALLBACK_COLOR;
  const targetCategory = categoryInfos.category ?? null;
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const sourceItems: SpendingItem[] = (
    isMonthly ? (spendingsByMonth ?? []) : (spendingsByWeek ?? []).flatMap((g) => g.items)
  ).filter((s) => (s.category ?? null) === targetCategory && s.label.toLowerCase().includes(normalizedSearchTerm));

  const grouped = groupByDate(sourceItems);
  const groupedEntries = Object.entries(grouped);

  const dayTotal = (items: SpendingItem[]) => items.reduce((acc, s) => acc + Number(s.amount), 0);

  const cumulativeAt = (idx: number): number =>
    groupedEntries.slice(0, idx + 1).reduce((acc, [, items]) => acc + dayTotal(items), 0);

  const periodLabel = isMonthly
    ? from
      ? format(from, "MMMM yyyy", { locale: fr })
      : ""
    : from && to
      ? `${format(from, "dd")} — ${format(to, "dd MMM yyyy", { locale: fr })}`
      : "";

  // Click a day → jump to the Dépenses page on the week that contains it.
  const goToDayWeek = (date: string) => {
    const dateISO = format(parseISO(date), DATE_FORMAT);
    const normalizedPath = pathname.replace(/\/+$/, "") || "/";
    const params =
      normalizedPath === SPENDINGS_PATH ? new URLSearchParams(searchParams.toString()) : new URLSearchParams();
    params.set(DATE_QUERY_PARAM, dateISO);
    router.push(`${SPENDINGS_PATH}?${params.toString()}`);
    handleClickOutside();
  };

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClickOutside();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="catd-backdrop" />
        <div className="catd-viewport">
          <DialogPrimitive.Content
            className="catd"
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              searchRef.current?.focus({ preventScroll: true });
            }}
          >
            <div className="catd-h">
              <span
                className="catd-swatch"
                style={{ background: categoryColor }}
              />
              <DialogPrimitive.Title asChild>
                <span className="catd-name">{categoryInfos.category ?? t.noCategoryLabel}</span>
              </DialogPrimitive.Title>
              <span className="catd-total">
                <span className="k">{t.total} :</span>
                <span className="v">{euro(total)} €</span>
              </span>
              <span className="catd-sp" />
              {periodLabel && <span className="catd-period">{periodLabel}</span>}
              <DialogPrimitive.Close
                className="catd-close"
                aria-label={t.close}
              >
                <X
                  size={13}
                  strokeWidth={2.5}
                />
              </DialogPrimitive.Close>
            </div>

            <div className="catd-filter">
              <span className="catd-filter-lbl">{t.filter} :</span>
              <span className="catd-search">
                <Search
                  size={15}
                  strokeWidth={2}
                />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.searchPlaceholder}
                />
              </span>
            </div>

            <div className="catd-body">
              {groupedEntries.length === 0 ? (
                <div className="catd-empty">{normalizedSearchTerm ? t.noMatch : t.noSpendings}</div>
              ) : (
                groupedEntries.map(([date, items], i) => {
                  const cumulative = cumulativeAt(i);
                  const pct = total > 0 ? (cumulative / total) * 100 : 0;
                  return (
                    <button
                      key={date}
                      type="button"
                      className="catd-day"
                      title={t.seeWeek}
                      onClick={() => goToDayWeek(date)}
                    >
                      <div className="catd-day-h">
                        <div className="catd-day-title">
                          {format(parseISO(date), "EEEE dd MMMM", {
                            locale: fr,
                          })}
                          <ChevronRight
                            className="chev"
                            size={15}
                            strokeWidth={2.5}
                          />
                        </div>
                        <div className="catd-day-stats">
                          <div className="catd-stat">
                            <span className="k">{t.dayTotal}</span>
                            <span className="v">
                              {euro(dayTotal(items))}
                              <span className="cur"> €</span>
                            </span>
                          </div>
                          <div className="catd-stat">
                            <span className="k">{t.cumulativeTotal}</span>
                            <span className="v">
                              {euro(cumulative)}
                              <span className="cur"> €</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="catd-day-pct">
                        {Math.round(pct)}% {pctWord} ({pct.toFixed(1)}%)
                      </div>

                      <div className="catd-day-list">
                        {items.map((spending) => (
                          <div
                            key={spending.ID}
                            className="catd-exp"
                          >
                            <span
                              className="dot"
                              style={{ background: categoryColor }}
                            />
                            <span className="l">{spending.label}</span>
                            <span className="a">
                              {euro(Number(spending.amount))}
                              <span className="cur"> €</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default SpendingsListModal;
