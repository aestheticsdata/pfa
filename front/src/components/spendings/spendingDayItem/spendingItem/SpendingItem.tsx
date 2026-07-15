"use client";

import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import InvoiceModal from "@components/spendings/invoiceModal/InvoiceModal";
import useReccurings from "@components/spendings/services/useReccurings";
import useSpendings from "@components/spendings/services/useSpendings";
import { cn } from "@lib/utils";
import { Edit2, ImageIcon, Trash2 } from "lucide-react";
import { useState } from "react";

import type { SpendingListItem } from "@components/spendings/types";

interface SpendingItemProps {
  spending: SpendingListItem;
  editCallback: (spending: SpendingListItem) => void;
  toggleAddSpending: () => void;
  isRecurring?: boolean;
}

const SpendingItem = ({ spending, editCallback, toggleAddSpending, isRecurring }: SpendingItemProps) => {
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const { deleteSpending } = useSpendings();
  const { deleteRecurring } = useReccurings();

  const spendingLabel = spending.label ?? "";
  const hasInvoice = "invoicefile" in spending && Boolean(spending.invoicefile);

  const onConfirmDelete = () => {
    if (isRecurring) {
      deleteRecurring.mutate({ recurring: spending });
    } else {
      deleteSpending.mutate({ spending });
    }
    toggleAddSpending();
    setIsDeleteConfirmVisible(false);
  };

  const onCancelDelete = () => {
    toggleAddSpending();
    setIsDeleteConfirmVisible(false);
  };

  if (isDeleteConfirmVisible) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 bg-danger-surface border border-danger-border-soft rounded">
        <span className="text-ink-2 text-sm flex-1">Supprimer cette dépense ?</span>
        <button
          type="button"
          onClick={onCancelDelete}
          className="px-3 py-1.5 bg-surface-hi hover:bg-surface-hover text-ink-2 rounded transition-colors text-sm"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirmDelete}
          className="px-3 py-1.5 bg-danger-solid hover:brightness-110 text-on-danger rounded transition-colors text-sm"
        >
          Confirmer
        </button>
      </div>
    );
  }

  const category = "category" in spending ? spending.category : null;
  const categoryColor =
    "categoryColor" in spending && spending.categoryColor ? spending.categoryColor : CATEGORY_FALLBACK;

  return (
    <>
      {isInvoiceModalVisible && (
        <InvoiceModal
          handleClickOutside={() => setIsInvoiceModalVisible(!isInvoiceModalVisible)}
          spending={spending}
        />
      )}
      <div className="group flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 py-1.5 hover:bg-surface-hover rounded px-2 transition-colors">
        <div className="flex items-center gap-2 sm:contents">
          <div
            className="w-1 h-5 rounded-full flex-shrink-0"
            style={{ backgroundColor: categoryColor }}
          />

          <span
            className="text-ink-3 text-sm flex-1 min-w-0 truncate"
            title={spendingLabel}
          >
            {spendingLabel}
          </span>

          <span className="text-ink text-sm shrink-0 tabular-nums sm:hidden">
            {Number(spending.amount).toFixed(2)} €
          </span>
        </div>

        <div className="flex items-center gap-2 pl-3 sm:pl-0 sm:contents">
          {!isRecurring && category && (
            <span
              className="px-2 py-0.5 rounded text-xs uppercase shrink-0 font-medium"
              style={{
                backgroundColor: `${categoryColor}30`,
                color: categoryColor,
              }}
            >
              {category}
            </span>
          )}

          <div className="flex gap-1 shrink-0 ml-auto sm:ml-0 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 sm:transition-opacity">
            <button
              type="button"
              onClick={() => setIsInvoiceModalVisible(true)}
              className={cn(
                "w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer",
                hasInvoice ? "bg-accent-d/80 hover:bg-accent-d" : "bg-surface-hi hover:bg-elec",
              )}
              title="Facture"
            >
              <ImageIcon className="w-3 h-3 text-ink-2" />
            </button>
            <button
              type="button"
              onClick={() => editCallback(spending)}
              className="w-6 h-6 bg-surface-hi hover:bg-surface-hover rounded flex items-center justify-center transition-colors cursor-pointer"
              title="Modifier"
            >
              <Edit2 className="w-3 h-3 text-ink-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                toggleAddSpending();
                setIsDeleteConfirmVisible(true);
              }}
              className="w-6 h-6 bg-surface-hi hover:bg-danger-solid rounded flex items-center justify-center transition-colors cursor-pointer"
              title="Supprimer"
            >
              <Trash2 className="w-3 h-3 text-ink-3 group-hover:text-ink" />
            </button>
          </div>

          <span className="hidden sm:inline text-ink text-sm shrink-0 min-w-[70px] text-right tabular-nums">
            {Number(spending.amount).toFixed(2)} €
          </span>
        </div>
      </div>
    </>
  );
};

export default SpendingItem;
