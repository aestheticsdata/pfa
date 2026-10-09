"use client";

import useSpendingsPageStore from "@components/spendings/stores/useSpendingsPageStore";
import MergeGroupModal from "@components/spendings/view/selection/MergeGroupModal";
import ShareReceiptModal from "@components/spendings/view/selection/ShareReceiptModal";
import useExitSelectionOnEscape from "@components/spendings/view/selection/useExitSelectionOnEscape";
import useSelectedEntries from "@components/spendings/view/selection/useSelectedEntries";
import { Button } from "@components/ui/button";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { ImageIcon, Layers, X } from "lucide-react";
import { useState } from "react";

const BATCH_MODAL = {
  merge: "merge",
  share: "share",
} as const;
type BatchModalKind = (typeof BATCH_MODAL)[keyof typeof BATCH_MODAL];

const SEPARATOR = "h-5 w-px shrink-0 bg-line max-md:hidden";

/**
 * Floating action bar while rows are ticked (PFA-189): count and total, then
 * "Group" (one day only) and "Shared receipt" (any days of the week), from 2
 * rows. Escape or × leaves the selection on every card.
 */
const SelectionBar = () => {
  const { groups: t } = useTranslations("spendings");
  const { euro } = useFormat();
  const isSelecting = useSpendingsPageStore((s) => s.selectingDays.length > 0);
  const exitSelection = useSpendingsPageStore((s) => s.exitSelection);
  const flashEntry = useSpendingsPageStore((s) => s.flashEntry);
  const selection = useSelectedEntries();
  const [modal, setModal] = useState<BatchModalKind | null>(null);
  useExitSelectionOnEscape();

  if (!isSelecting && !modal) {
    return null;
  }

  const count = selection.length;
  const total = selection.reduce((sum, s) => sum + s.entry.amount, 0);
  const isSameDay = new Set(selection.map((s) => s.dayIso)).size <= 1;
  const canAct = count >= 2;
  const hint = !canAct ? t.selection.atLeastTwo : !isSameDay ? t.selection.sameDayOnly : "";

  const done = (groupID?: string) => {
    exitSelection();
    if (groupID) flashEntry(groupID);
  };

  return (
    <>
      {isSelecting && (
        <div
          data-testid="selection-bar"
          className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 animate-in items-center gap-2.5 rounded-xl border border-selection-bar-border bg-selection-bar-surface py-2 pr-2 pl-4 shadow-selection-bar fade-in slide-in-from-bottom-4 duration-200 max-md:inset-x-3 max-md:translate-x-0 max-md:flex-wrap"
        >
          <span className="text-sm text-ink-2">
            <strong className="font-semibold text-ink">{count}</strong> {t.selection.selected(count)}
          </span>
          <span className="num text-sm text-ink-3">{euro(total)} €</span>
          {hint && <span className="text-xs text-ink-4">{hint}</span>}
          <span className={SEPARATOR} />
          <Button
            type="button"
            variant="muted"
            size="sm"
            data-testid="selection-group"
            disabled={!canAct || !isSameDay}
            onClick={() => setModal(BATCH_MODAL.merge)}
            className="disabled:opacity-38"
          >
            <Layers className="size-3.5" />
            {t.selection.group}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            data-testid="selection-share-receipt"
            disabled={!canAct}
            onClick={() => setModal(BATCH_MODAL.share)}
            className="disabled:opacity-38"
          >
            <ImageIcon className="size-3.5" />
            {t.selection.sharedReceipt}
          </Button>
          <span className={SEPARATOR} />
          <button
            type="button"
            data-testid="selection-exit"
            title={t.selection.exit}
            aria-label={t.selection.exit}
            onClick={exitSelection}
            className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink-4 transition-colors hover:bg-surface-hi hover:text-ink"
          >
            <X className="size-3.25" />
          </button>
        </div>
      )}

      {modal === BATCH_MODAL.merge && (
        <MergeGroupModal
          selection={selection}
          onClose={() => setModal(null)}
          onGrouped={done}
        />
      )}
      {modal === BATCH_MODAL.share && (
        <ShareReceiptModal
          selection={selection}
          onClose={() => setModal(null)}
          onShared={() => done()}
        />
      )}
    </>
  );
};

export default SelectionBar;
