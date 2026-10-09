"use client";

import { BATCH_MODAL } from "@components/spendings/config/constants";
import useSpendingsPageStore from "@components/spendings/stores/useSpendingsPageStore";
import useSelectedEntries from "@components/spendings/view/selection/useSelectedEntries";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { ImageIcon, Layers, X } from "lucide-react";

// Both actions weigh the same, so they share one look (PFA-197).
const ACTION =
  "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.75 whitespace-nowrap rounded-md border border-accent-d bg-accent-bg px-2.5 text-sm font-medium text-accent-strong transition-colors enabled:hover:border-accent-strong disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-ink-4";

/**
 * Actions on the ticked rows, inside a day card in selection mode (PFA-197):
 * laid over the card's "Add" row so the card keeps its height. Count, total
 * and actions are page-wide — rows ticked in other cards count too. On a
 * narrow card the total goes first, then the word after the count
 * (day cards are ≥ 500px wide on desktop, full width on phones).
 */
const DaySelectionBar = () => {
  const { groups: t } = useTranslations("spendings");
  const { euro } = useFormat();
  const exitSelection = useSpendingsPageStore((s) => s.exitSelection);
  const openBatchModal = useSpendingsPageStore((s) => s.openBatchModal);
  const selection = useSelectedEntries();

  const count = selection.length;
  const total = selection.reduce((sum, s) => sum + s.entry.amount, 0);
  const isSameDay = new Set(selection.map((s) => s.dayIso)).size <= 1;
  const canAct = count >= 2;

  return (
    <div
      data-testid="selection-bar"
      className="@container absolute inset-0 animate-in fade-in duration-150"
    >
      <div className="flex h-full items-center gap-2 overflow-hidden rounded-lg border border-selection-bar-border bg-selection-bar-surface py-1.5 pr-1.5 pl-3.5 shadow-selection-bar">
        <span className="shrink-0 whitespace-nowrap text-sm text-ink-2">
          <strong className="num font-semibold text-ink">{count}</strong>
          <span className="@max-md:hidden"> {t.selection.selected(count)}</span>
        </span>
        <span className="num shrink-0 whitespace-nowrap text-sm text-ink-3 @max-lg:hidden">{euro(total)} €</span>
        <span className="ml-auto" />
        <button
          type="button"
          data-testid="selection-group"
          title={!canAct ? t.selection.atLeastTwo : !isSameDay ? t.selection.sameDayOnly : undefined}
          disabled={!canAct || !isSameDay}
          onClick={() => openBatchModal(BATCH_MODAL.merge)}
          className={ACTION}
        >
          <Layers className="size-3.5" />
          {t.selection.group}
        </button>
        <button
          type="button"
          data-testid="selection-share-receipt"
          title={!canAct ? t.selection.atLeastTwo : undefined}
          disabled={!canAct}
          onClick={() => openBatchModal(BATCH_MODAL.share)}
          className={ACTION}
        >
          <ImageIcon className="size-3.5" />
          {t.selection.sharedReceipt}
        </button>
        <button
          type="button"
          data-testid="selection-exit"
          title={t.selection.exit}
          aria-label={t.selection.exit}
          onClick={exitSelection}
          className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md border border-selection-bar-exit-border text-ink-3 transition-colors hover:text-ink"
        >
          <X className="size-3.25" />
        </button>
      </div>
    </div>
  );
};

export default DaySelectionBar;
