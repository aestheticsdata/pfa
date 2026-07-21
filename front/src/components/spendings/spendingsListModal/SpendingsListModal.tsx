"use client";

import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { DATE_FORMAT, MONTHLY } from "@components/spendings/config/constants";
import useSpendings from "@components/spendings/services/useSpendings";
import { buildSpendingsPath } from "@helpers/dateRoute";
import { euro } from "@lib/format";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import texts from "@text/spendings";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import parseISO from "date-fns/parseISO";
import { ChevronRight, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import type { SpendingItem } from "@components/spendings/types";
import type { CategoryProps } from "@src/interfaces/category";

interface SpendingsListModalProps {
  handleClickOutside: () => void;
  periodType: string;
  categoryInfos: CategoryProps;
  total: number;
}

const FALLBACK_COLOR = CATEGORY_FALLBACK;

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
 * card links back to the week that contains it. Design ported from
 * design_handoff_pfa/designs/assets/cat-detail.{js,css} onto pfa tokens.
 */
const SpendingsListModal = ({ handleClickOutside, periodType, categoryInfos, total }: SpendingsListModalProps) => {
  const { spendingsByWeek, spendingsByMonth } = useSpendings();
  const { from, to } = useDatePickerWrapperStore();
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  // Click a day → jump to the Dépenses page on the week that contains it. This is
  // a cross-page navigation (the modal opens from the Dashboard too), so it keeps
  // building a real href via buildSpendingsPath rather than an in-page nuqs setter.
  const goToDayWeek = (date: string) => {
    const dateISO = format(parseISO(date), DATE_FORMAT);
    router.push(buildSpendingsPath(dateISO));
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
        <DialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-[oklch(0.02_0.004_250/0.62)] backdrop-blur-sm animate-in fade-in duration-150 ease-out" />
        <div className="pointer-events-none fixed inset-0 z-[201] grid place-items-center p-8 max-[640px]:p-3.5">
          <DialogPrimitive.Content
            className="pfa-card shadow-modal! pointer-events-auto flex max-h-[88vh] w-[min(1000px,94vw)] flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3.5 zoom-in-95 duration-200 max-[640px]:max-h-[92vh]"
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              searchRef.current?.focus({ preventScroll: true });
            }}
          >
            <div className="flex shrink-0 items-center gap-3.5 border-b border-line bg-[linear-gradient(180deg,oklch(1_0_0/0.045),oklch(1_0_0/0.018))] px-5.5 py-4.5 max-[640px]:flex-wrap max-[640px]:gap-x-3 max-[640px]:gap-y-2.5">
              <span
                className="size-7.5 shrink-0 rounded-md shadow-[inset_0_1px_0_oklch(1_0_0/0.25)]"
                style={{ background: categoryColor }}
              />
              <DialogPrimitive.Title asChild>
                <span className="text-xl font-semibold capitalize tracking-snug text-ink">
                  {categoryInfos.category ?? t.noCategoryLabel}
                </span>
              </DialogPrimitive.Title>
              <span className="inline-flex items-baseline gap-2">
                <span className="text-2xs font-medium uppercase tracking-widest text-ink-4">{t.total}&nbsp;:</span>
                <span className="font-mono text-base font-semibold tabular-nums text-ink">{euro(total)} €</span>
              </span>
              <span className="flex-1 max-[640px]:order-5 max-[640px]:h-0 max-[640px]:basis-full" />
              {periodLabel && (
                <span className="whitespace-nowrap text-xs font-medium uppercase tracking-widest text-ink-3 max-[640px]:order-6">
                  {periodLabel}
                </span>
              )}
              <DialogPrimitive.Close
                className="grid size-7.5 shrink-0 cursor-pointer place-items-center rounded-md border border-line bg-surface-hi text-ink-3 transition duration-100 hover:border-elec hover:bg-elec/12 hover:text-elec hover:ring-3 hover:ring-elec/16"
                aria-label={t.close}
              >
                <X
                  className="block"
                  size={13}
                  strokeWidth={2.5}
                />
              </DialogPrimitive.Close>
            </div>

            <div className="flex shrink-0 items-center gap-3.5 border-b border-line px-5.5 py-3.25">
              <span className="shrink-0 text-xs text-ink-3">{t.filter}&nbsp;:</span>
              <span className="relative block flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-4"
                  size={15}
                  strokeWidth={2}
                />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full rounded-sm border border-line bg-surface-base py-2.25 pl-9 pr-3 text-sm text-ink outline-none transition duration-100 placeholder:text-ink-4 focus:border-elec focus:ring-3 focus:ring-elec/14"
                />
              </span>
            </div>

            <div className="flex min-h-0 flex-auto flex-col gap-3.5 overflow-y-auto px-5.5 pb-5.5 pt-4">
              {groupedEntries.length === 0 ? (
                <div className="py-10 text-center text-sm text-ink-4">
                  {normalizedSearchTerm ? t.noMatch : t.noSpendings}
                </div>
              ) : (
                groupedEntries.map(([date, items], i) => {
                  const cumulative = cumulativeAt(i);
                  const pct = total > 0 ? (cumulative / total) * 100 : 0;
                  return (
                    <button
                      key={date}
                      type="button"
                      className="group w-full shrink-0 cursor-pointer overflow-hidden rounded-lg border border-line bg-surface-elev text-left transition duration-150 hover:-translate-y-px hover:border-elec hover:shadow-[0_0_0_1px_var(--elec),0_14px_34px_oklch(0.72_0.15_230/0.2)]"
                      title={t.seeWeek}
                      onClick={() => goToDayWeek(date)}
                    >
                      <div className="flex items-start justify-between gap-4 px-4.5 pt-3.75 group-hover:bg-[linear-gradient(180deg,oklch(0.72_0.15_230/0.06),transparent)] max-[640px]:flex-col max-[640px]:gap-2.5">
                        <div className="flex items-center gap-2 pt-0.75 text-base font-bold uppercase text-ink group-hover:text-elec">
                          {format(parseISO(date), "EEEE dd MMMM", {
                            locale: fr,
                          })}
                          <ChevronRight
                            className="-translate-x-1 text-elec opacity-0 transition duration-150 group-hover:translate-x-0 group-hover:opacity-100"
                            size={15}
                            strokeWidth={2.5}
                          />
                        </div>
                        <div className="flex gap-5 max-[640px]:justify-between max-[640px]:self-stretch">
                          <div className="text-right">
                            <span className="mb-1.5 block text-2xs font-medium tracking-wider text-ink-4">
                              {t.dayTotal}
                            </span>
                            <span className="inline-block whitespace-nowrap rounded-sm border border-line bg-surface-hi px-3 py-1.5 font-mono text-sm font-semibold tabular-nums text-ink">
                              {euro(dayTotal(items))}
                              <span className="font-medium text-ink-3"> €</span>
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="mb-1.5 block text-2xs font-medium tracking-wider text-ink-4">
                              {t.cumulativeTotal}
                            </span>
                            <span className="inline-block whitespace-nowrap rounded-sm border border-line bg-surface-hi px-3 py-1.5 font-mono text-sm font-semibold tabular-nums text-ink">
                              {euro(cumulative)}
                              <span className="font-medium text-ink-3"> €</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="px-4.5 pb-3.25 pt-2.25 text-right font-mono text-xs font-medium tabular-nums text-accent-strong">
                        {Math.round(pct)}% {pctWord} ({pct.toFixed(1)}%)
                      </div>

                      <div className="border-t border-line-soft bg-surface-base px-4.5 py-1.5">
                        {items.map((spending) => (
                          <div
                            key={spending.ID}
                            className="grid grid-cols-[10px_1fr_auto] items-center gap-3 border-b border-line-soft py-2.5 last:border-b-0"
                          >
                            <span
                              className="size-2 rounded-full"
                              style={{ background: categoryColor }}
                            />
                            <span className="text-sm text-ink">{spending.label}</span>
                            <span className="whitespace-nowrap text-right font-mono text-sm font-medium tabular-nums text-ink">
                              {euro(Number(spending.amount))}
                              <span className="font-normal text-ink-3"> €</span>
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
