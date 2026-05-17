"use client";

import { useState } from "react";
import { Edit2, Trash2, ImageIcon } from "lucide-react";
import InvoiceModal from "@components/spendings/invoiceModal/InvoiceModal";
import useSpendings from "@components/spendings/services/useSpendings";
import useReccurings from "@components/spendings/services/useReccurings";
import { cn } from "@lib/utils";

import type { SpendingListItem } from "@components/spendings/types";

interface SpendingItemProps {
  spending: SpendingListItem;
  editCallback: (spending: SpendingListItem) => void;
  toggleAddSpending: () => void;
  isRecurring?: boolean;
}

const SpendingItem = ({
  spending,
  editCallback,
  toggleAddSpending,
  isRecurring,
}: SpendingItemProps) => {
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const { deleteSpending } = useSpendings();
  const { deleteRecurring } = useReccurings();

  const spendingLabel = spending.label ?? "";
  const hasInvoice =
    "invoicefile" in spending && Boolean(spending.invoicefile);

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
      <div className="flex items-center gap-2 py-2 px-3 bg-red-900/20 border border-red-600/40 rounded">
        <span className="text-gray-200 text-sm flex-1">
          Supprimer cette dépense ?
        </span>
        <button
          type="button"
          onClick={onCancelDelete}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors text-sm"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirmDelete}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm"
        >
          Confirmer
        </button>
      </div>
    );
  }

  const category =
    "category" in spending ? spending.category : null;
  const categoryColor =
    "categoryColor" in spending && spending.categoryColor
      ? spending.categoryColor
      : "#94a3b8";

  return (
    <>
      {isInvoiceModalVisible && (
        <InvoiceModal
          handleClickOutside={() =>
            setIsInvoiceModalVisible(!isInvoiceModalVisible)
          }
          spending={spending}
        />
      )}
      <div className="group flex items-center gap-2 py-1.5 hover:bg-gray-800/40 rounded px-2 transition-colors">
        <div
          className="w-1 h-5 rounded-full flex-shrink-0"
          style={{ backgroundColor: categoryColor }}
        />

        <span
          className="text-gray-300 text-sm flex-1 min-w-0 truncate"
          title={spendingLabel}
        >
          {spendingLabel}
        </span>

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

        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setIsInvoiceModalVisible(true)}
            className={cn(
              "w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer",
              hasInvoice
                ? "bg-emerald-700/80 hover:bg-emerald-600"
                : "bg-gray-700/80 hover:bg-cyan-600",
            )}
            title="Facture"
          >
            <ImageIcon className="w-3 h-3 text-gray-200" />
          </button>
          <button
            type="button"
            onClick={() => editCallback(spending)}
            className="w-6 h-6 bg-gray-700/80 hover:bg-gray-600 rounded flex items-center justify-center transition-colors cursor-pointer"
            title="Modifier"
          >
            <Edit2 className="w-3 h-3 text-gray-300" />
          </button>
          <button
            type="button"
            onClick={() => {
              toggleAddSpending();
              setIsDeleteConfirmVisible(true);
            }}
            className="w-6 h-6 bg-gray-700/80 hover:bg-red-600 rounded flex items-center justify-center transition-colors cursor-pointer"
            title="Supprimer"
          >
            <Trash2 className="w-3 h-3 text-gray-300 group-hover:text-white" />
          </button>
        </div>

        <span className="text-gray-100 text-sm shrink-0 min-w-[70px] text-right tabular-nums">
          {Number(spending.amount).toFixed(2)} €
        </span>
      </div>
    </>
  );
};

export default SpendingItem;
