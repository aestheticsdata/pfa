"use client";

import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { IconButton } from "@components/shared/IconButton";
import EntryReceiptModal from "@components/spendings/invoiceModal/EntryReceiptModal";
import useSpendings from "@components/spendings/services/useSpendings";
import { TAG_CHIP } from "@components/spendings/view/helpers/tagChipClass";
import useEntryRowState from "@components/spendings/view/hooks/useEntryRowState";
import ReceiptMark from "@components/spendings/view/rows/ReceiptMark";
import RowConfirm from "@components/spendings/view/rows/RowConfirm";
import { rowStateClass, TX_ROW } from "@components/spendings/view/rows/rowClasses";
import SelectBox from "@components/spendings/view/rows/SelectBox";
import SpotlightVeil from "@components/spendings/view/SpotlightVeil";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { ImageIcon, Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import type { SingleDayEntry } from "@components/spendings/interfaces/spendingGroupTypes";
import type { SpendingItem } from "@components/spendings/interfaces/spendingListTypes";

const FALLBACK_COLOR = CATEGORY_FALLBACK;

interface SpendingTxRowProps {
  entry: SingleDayEntry;
  /** The day card's day (yyyy-MM-dd) — selection is per card (PFA-189). */
  dayIso: string;
  onEdit: (spending: SpendingItem) => void;
}

/**
 * A single transaction row in a Spendings day-card: colour pill + label
 * (+ receipt indicator) · category tag · amount, with hover actions
 * (receipt / edit / delete) and an inline delete confirmation.
 */
const SpendingTxRow = ({ entry, dayIso, onEdit }: SpendingTxRowProps) => {
  const { spending } = entry;
  const { euro } = useFormat();
  const spendings = useTranslations("spendings");
  const { txRow, item } = spendings;
  const [confirming, setConfirming] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const { deleteSpending } = useSpendings();
  const isSpotlit = useDatePickerWrapperStore((state) => state.spotlightSpendingId === spending.ID);
  const rowRef = useRef<HTMLDivElement>(null);
  const row = useEntryRowState(entry, dayIso);

  const color = spending.categoryColor || FALLBACK_COLOR;
  const category = spending.category ?? null;
  const hasInvoice = Boolean(spending.invoicefile);

  const onConfirmDelete = () => {
    deleteSpending.mutate({ spending });
    setConfirming(false);
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: a click anywhere on the row ticks it in selection mode; the tick itself is the keyboard path
    <div
      data-testid="tx-row"
      data-has-receipt={hasInvoice}
      data-spending-id={spending.ID}
      data-selected={row.isSelected}
      ref={rowRef}
      onClick={row.isSelecting ? row.toggle : undefined}
      onPointerEnter={row.onPointerEnter}
      onPointerLeave={row.onPointerLeave}
      className={cn(TX_ROW, rowStateClass(row))}
    >
      {confirming ? (
        <RowConfirm
          message={item.deleteConfirm}
          onCancel={() => setConfirming(false)}
          onConfirm={onConfirmDelete}
        />
      ) : (
        <>
          <span className="relative z-10 flex min-w-0 items-center gap-2.5 text-sm text-ink max-md:col-start-1 max-md:row-start-1 max-md:text-base">
            <SelectBox
              isVisible={row.isSelecting}
              checked={row.isSelected}
              onToggle={row.toggle}
            />
            <span
              className="h-5.5 w-0.75 shrink-0 rounded-xs"
              style={{ background: color }}
            />
            <span
              className="truncate max-md:line-clamp-2 max-md:whitespace-normal"
              title={spending.label}
            >
              {spending.label}
            </span>
            {hasInvoice && <ReceiptMark shareCount={row.shareCount} />}
          </span>

          <span className="relative z-10 justify-self-end max-md:col-start-1 max-md:row-start-2 max-md:justify-self-start">
            {category && (
              <span
                className={cn(TAG_CHIP, "max-md:border-transparent max-md:bg-transparent max-md:p-0")}
                style={{ color }}
              >
                {category}
              </span>
            )}
          </span>

          <span className="relative z-10 justify-self-end whitespace-nowrap text-right font-mono text-sm font-medium tabular-nums text-ink max-md:col-start-2 max-md:row-start-1 max-md:self-center">
            {euro(spending.amount)}
            <span className="text-xs font-normal text-ink-3"> €</span>
          </span>

          {!row.isSelecting && (
            <span className="absolute right-22 top-1/2 z-20 hidden -translate-y-1/2 items-center gap-1.5 bg-[linear-gradient(90deg,transparent,var(--surface-hi)_26px)] pl-7.5 group-hover:flex max-md:static max-md:col-start-2 max-md:row-start-2 max-md:flex max-md:translate-y-0 max-md:justify-self-end max-md:bg-none max-md:p-0">
              <IconButton
                variant="bordered"
                size={7}
                data-testid="tx-receipt"
                title={hasInvoice ? txRow.viewReceipt : txRow.addReceipt}
                onClick={() => setInvoiceOpen(true)}
                className={
                  hasInvoice
                    ? "border-accent-strong bg-accent-strong text-[oklch(0.18_0.01_148)] hover:text-[oklch(0.18_0.01_148)] hover:brightness-[1.06]"
                    : undefined
                }
              >
                <ImageIcon />
              </IconButton>
              <IconButton
                variant="bordered"
                size={7}
                data-testid="tx-edit"
                title={item.actions.edit}
                onClick={() => onEdit(spending)}
              >
                <Pencil />
              </IconButton>
              <IconButton
                variant="danger"
                size={7}
                data-testid="tx-delete"
                title={item.actions.delete}
                onClick={() => setConfirming(true)}
              >
                <Trash2 />
              </IconButton>
            </span>
          )}
        </>
      )}

      {isSpotlit && <SpotlightVeil target={rowRef} />}

      {invoiceOpen && (
        <EntryReceiptModal
          entry={entry}
          onClose={() => setInvoiceOpen(false)}
        />
      )}
    </div>
  );
};

export default SpendingTxRow;
