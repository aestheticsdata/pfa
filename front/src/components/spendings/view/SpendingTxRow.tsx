"use client";

import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import { IconButton } from "@components/shared/IconButton";
import InvoiceModal from "@components/spendings/invoiceModal/InvoiceModal";
import useSpendings from "@components/spendings/services/useSpendings";
import { euro } from "@lib/format";
import spendings from "@text/spendings";
import { ImageIcon, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import type { SpendingItem } from "@components/spendings/types";

const FALLBACK_COLOR = CATEGORY_FALLBACK;

interface SpendingTxRowProps {
  spending: SpendingItem;
  onEdit: (spending: SpendingItem) => void;
}

/**
 * A single transaction row in a Dépenses day-card: colour pill + label
 * (+ receipt indicator) · category tag · amount, with hover actions
 * (receipt / edit / delete) and an inline delete confirmation.
 */
const SpendingTxRow = ({ spending, onEdit }: SpendingTxRowProps) => {
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
    <div className="sp-tx">
      {confirming ? (
        <div
          className="sp-tx-confirm"
          role="alertdialog"
          aria-label={txRow.deleteAria}
          style={{ gridColumn: "1 / -1" }}
        >
          <span className="txt">{item.deleteConfirm}</span>
          <span className="acts">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setConfirming(false)}
            >
              {spendings.actions.cancel}
            </button>
            <button
              type="button"
              className="btn-confirm"
              onClick={onConfirmDelete}
            >
              {spendings.actions.confirm}
            </button>
          </span>
        </div>
      ) : (
        <>
          <span className="sp-t-label">
            <span
              className="pill"
              style={{ background: color }}
            />
            <span
              className="lbl-txt"
              title={spending.label}
            >
              {spending.label}
            </span>
            {hasInvoice && (
              <span
                className="recipt"
                role="img"
                aria-label={txRow.receiptAttachedAria}
              >
                <ImageIcon className="size-3.5" />
              </span>
            )}
          </span>

          {category && (
            <span className="sp-t-tag">
              <span
                className="sp-tag"
                style={{ color }}
              >
                {category}
              </span>
            </span>
          )}

          <span className="sp-t-amt">
            {euro(spending.amount)}
            <span className="cur"> €</span>
          </span>

          <span className="sp-t-actions">
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
