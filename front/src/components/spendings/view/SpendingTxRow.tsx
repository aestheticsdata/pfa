"use client";

import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import { IconButton } from "@components/shared/IconButton";
import InvoiceModal from "@components/spendings/invoiceModal/InvoiceModal";
import useSpendings from "@components/spendings/services/useSpendings";
import { TAG_CHIP } from "@components/spendings/view/helpers/tagChipClass";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { ImageIcon, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import type { SpendingItem } from "@components/spendings/interfaces/spendingListTypes";

const FALLBACK_COLOR = CATEGORY_FALLBACK;

interface SpendingTxRowProps {
  spending: SpendingItem;
  onEdit: (spending: SpendingItem) => void;
}

/**
 * A single transaction row in a Spendings day-card: colour pill + label
 * (+ receipt indicator) · category tag · amount, with hover actions
 * (receipt / edit / delete) and an inline delete confirmation.
 */
const SpendingTxRow = ({ spending, onEdit }: SpendingTxRowProps) => {
  const { euro } = useFormat();
  const spendings = useTranslations("spendings");
  const { txRow, item } = spendings;
  const [confirming, setConfirming] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const { deleteSpending } = useSpendings();

  const color = spending.categoryColor || FALLBACK_COLOR;
  const category = spending.category ?? null;
  const hasInvoice = Boolean(spending.invoicefile);

  const onConfirmDelete = () => {
    deleteSpending.mutate({ spending });
    setConfirming(false);
  };

  return (
    <div className="group relative grid grid-cols-[minmax(0,1fr)_auto_78px] items-center gap-3 border-t border-line-soft py-2.75 first:border-t-0 before:pointer-events-none before:absolute before:inset-x-0 before:inset-y-px before:z-0 before:rounded-lg before:transition-colors before:duration-100 before:content-[''] hover:before:bg-surface-hi max-[759px]:grid-cols-[minmax(0,1fr)_auto] max-[759px]:grid-rows-[auto_auto] max-[759px]:gap-y-1.5">
      {confirming ? (
        <div
          className="relative z-10 col-span-full flex items-center gap-3 rounded-lg border border-danger-border-soft bg-danger-surface py-2 pl-3.75 pr-2.5 shadow-[0_6px_20px_oklch(0.3_0.16_25/0.28)]"
          role="alertdialog"
          aria-label={txRow.deleteAria}
        >
          <span className="flex-auto text-sm font-medium text-ink">{item.deleteConfirm}</span>
          <span className="flex shrink-0 gap-2">
            <button
              type="button"
              className="cursor-pointer rounded-md border border-line bg-surface-hi px-3.75 py-1.75 text-sm font-semibold text-ink-2 transition duration-100 hover:border-ink-4 hover:bg-surface-hover hover:text-ink"
              onClick={() => setConfirming(false)}
            >
              {spendings.actions.cancel}
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-md border border-danger-solid bg-danger-solid px-3.75 py-1.75 text-sm font-semibold text-on-danger transition duration-100 hover:brightness-[1.08]"
              onClick={onConfirmDelete}
            >
              {spendings.actions.confirm}
            </button>
          </span>
        </div>
      ) : (
        <>
          <span className="relative z-10 flex min-w-0 items-center gap-2.5 text-sm text-ink max-[759px]:col-start-1 max-[759px]:row-start-1 max-[759px]:text-base">
            <span
              className="h-5.5 w-0.75 shrink-0 rounded-xs"
              style={{ background: color }}
            />
            <span
              className="truncate max-[759px]:line-clamp-2 max-[759px]:whitespace-normal"
              title={spending.label}
            >
              {spending.label}
            </span>
            {hasInvoice && (
              <span
                className="inline-flex shrink-0 text-ink-4"
                role="img"
                aria-label={txRow.receiptAttachedAria}
              >
                <ImageIcon className="size-3.5" />
              </span>
            )}
          </span>

          {category && (
            <span className="relative z-10 justify-self-end max-[759px]:col-start-1 max-[759px]:row-start-2 max-[759px]:justify-self-start">
              <span
                className={cn(TAG_CHIP, "max-[759px]:border-transparent max-[759px]:bg-transparent max-[759px]:p-0")}
                style={{ color }}
              >
                {category}
              </span>
            </span>
          )}

          <span className="relative z-10 justify-self-end whitespace-nowrap text-right font-mono text-sm font-medium tabular-nums text-ink max-[759px]:col-start-2 max-[759px]:row-start-1 max-[759px]:self-center">
            {euro(spending.amount)}
            <span className="text-xs font-normal text-ink-3"> €</span>
          </span>

          <span className="absolute right-22 top-1/2 z-20 hidden -translate-y-1/2 items-center gap-1.5 bg-[linear-gradient(90deg,transparent,var(--surface-hi)_26px)] pl-7.5 group-hover:flex max-[759px]:static max-[759px]:col-start-2 max-[759px]:row-start-2 max-[759px]:flex max-[759px]:translate-y-0 max-[759px]:justify-self-end max-[759px]:bg-none max-[759px]:p-0">
            <IconButton
              variant="bordered"
              size={7}
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
              title={item.actions.edit}
              onClick={() => onEdit(spending)}
            >
              <Pencil />
            </IconButton>
            <IconButton
              variant="danger"
              size={7}
              title={item.actions.delete}
              onClick={() => setConfirming(true)}
            >
              <Trash2 />
            </IconButton>
          </span>
        </>
      )}

      {invoiceOpen && (
        <InvoiceModal
          handleClickOutside={() => setInvoiceOpen(false)}
          spending={spending}
        />
      )}
    </div>
  );
};

export default SpendingTxRow;
