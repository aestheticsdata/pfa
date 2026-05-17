"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, ImageIcon } from "lucide-react";
import useReccurings from "@components/spendings/services/useReccurings";
import useSpendingDayItem from "@components/spendings/spendingDayItem/spendingItem/helpers/useSpendingDayItem";
import SpendingModal from "@components/spendings/common/spendingModal/SpendingModal";
import InvoiceModal from "@components/spendings/invoiceModal/InvoiceModal";
import { SurfaceCard } from "@components/ui/surface-card";
import { cn } from "@lib/utils";

import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";
import type { RecurringItem } from "@components/spendings/types";

interface FixedExpensesPanelProps {
  month: MonthRange;
}

const FixedExpensesPanel = ({ month }: FixedExpensesPanelProps) => {
  const { recurrings, deleteRecurring, error } = useReccurings();
  const {
    isModalVisible,
    spending,
    isEditing,
    addSpending,
    closeModal,
    editSpending,
  } = useSpendingDayItem();
  const [invoiceFor, setInvoiceFor] = useState<RecurringItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  if (error) {
    throw error;
  }

  const total =
    recurrings?.reduce((acc, r) => acc + Number(r.amount), 0) ?? 0;

  return (
    <SurfaceCard padding="lg" className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-100 text-lg font-medium">Dépenses fixes</h2>
        <button
          type="button"
          onClick={addSpending}
          className="w-8 h-8 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-cyan-500/20"
          aria-label="Ajouter une dépense fixe"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-linear-to-br from-cyan-950/40 via-blue-950/30 to-[#0a0a14] border border-cyan-500/40 rounded-xl p-5 shadow-[inset_0_0_30px_rgba(6,182,212,0.08)] mb-4">
        <div className="text-gray-200 font-medium">
          Total des dépenses fixes
        </div>
        <div className="text-cyan-400 text-3xl font-bold tracking-tight mt-1">
          {total.toFixed(2)} €
        </div>
      </div>

      <div className="recurrings-list-container flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
        {recurrings?.map((recurring) => {
          const isDeleting = pendingDelete === recurring.ID;
          if (isDeleting) {
            return (
              <div
                key={recurring.ID}
                className="flex items-center gap-2 py-2 px-3 bg-red-900/20 border border-red-600/40 rounded text-sm"
              >
                <span className="text-gray-200 flex-1 truncate">
                  Supprimer ?
                </span>
                <button
                  type="button"
                  onClick={() => setPendingDelete(null)}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors text-xs"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteRecurring.mutate({ recurring });
                    setPendingDelete(null);
                  }}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-xs"
                >
                  Confirmer
                </button>
              </div>
            );
          }

          return (
            <div
              key={recurring.ID}
              className="group flex items-center gap-2 py-1.5 hover:bg-gray-800/40 rounded px-2 transition-colors"
            >
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setInvoiceFor(recurring)}
                  className={cn(
                    "w-6 h-6 rounded flex items-center justify-center transition-colors opacity-60 group-hover:opacity-100 cursor-pointer",
                    recurring.invoicefile
                      ? "bg-emerald-700/80 hover:bg-emerald-600"
                      : "bg-gray-700/80 hover:bg-cyan-600",
                  )}
                  title="Facture"
                >
                  <ImageIcon className="w-3 h-3 text-gray-200" />
                </button>
                <button
                  type="button"
                  onClick={() => editSpending(recurring)}
                  className="w-6 h-6 bg-gray-700/80 hover:bg-gray-600 rounded flex items-center justify-center transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                  title="Modifier"
                >
                  <Edit2 className="w-3 h-3 text-gray-300" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(recurring.ID)}
                  className="w-6 h-6 bg-gray-700/80 hover:bg-red-600 rounded flex items-center justify-center transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 className="w-3 h-3 text-gray-300 group-hover:text-white" />
                </button>
              </div>
              <span
                className="text-gray-200 text-sm flex-1 min-w-0 truncate"
                title={recurring.label}
              >
                {recurring.label}
              </span>
              <span className="text-gray-100 text-sm flex-shrink-0 min-w-[70px] text-right tabular-nums">
                {Number(recurring.amount).toFixed(2)} €
              </span>
            </div>
          );
        })}
        {(!recurrings || recurrings.length === 0) && (
          <div className="text-center text-gray-500 text-sm py-4">
            Aucune dépense fixe pour ce mois.
          </div>
        )}
      </div>

      {isModalVisible && (
        <SpendingModal
          closeModal={closeModal}
          spending={spending}
          recurringType
          isEditing={isEditing}
          month={month}
        />
      )}

      {invoiceFor && (
        <InvoiceModal
          handleClickOutside={() => setInvoiceFor(null)}
          spending={invoiceFor}
        />
      )}
    </SurfaceCard>
  );
};

export default FixedExpensesPanel;
