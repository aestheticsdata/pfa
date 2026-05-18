"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, ImageIcon, ChevronDown } from "lucide-react";
import useReccurings from "@components/spendings/services/useReccurings";
import useSpendingDayItem from "@components/spendings/spendingDayItem/spendingItem/helpers/useSpendingDayItem";
import SpendingModal from "@components/spendings/common/spendingModal/SpendingModal";
import InvoiceModal from "@components/spendings/invoiceModal/InvoiceModal";
import { SurfaceCard } from "@components/ui/surface-card";
import spendingsText from "@components/spendings/config/text";
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
  const [isListExpanded, setIsListExpanded] = useState(false);

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

      <button
        type="button"
        onClick={() => setIsListExpanded((v) => !v)}
        className="sm:hidden flex items-center w-full mb-2 px-4 py-3 rounded-lg border border-gray-700/70 bg-gray-900/30 text-sm text-gray-200 hover:bg-gray-800/40 transition-colors cursor-pointer"
        aria-expanded={isListExpanded}
        aria-controls="recurrings-list-collapse"
      >
        <span>
          {isListExpanded
            ? spendingsText.dashboard.recurrings.hide
            : spendingsText.dashboard.recurrings.show}
        </span>
        <span className="ml-2 inline-flex items-center justify-center min-w-[24px] h-5 px-2 rounded-full bg-gray-700/70 text-xs text-gray-200 tabular-nums">
          {recurrings?.length ?? 0}
        </span>
        <ChevronDown
          className={cn(
            "ml-auto w-4 h-4 text-gray-400 transition-transform duration-300",
            isListExpanded && "rotate-180",
          )}
        />
      </button>

      <div
        id="recurrings-list-collapse"
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out sm:block sm:flex-1 sm:min-h-0",
          isListExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden sm:overflow-visible sm:h-full">
          <div className="recurrings-list-container flex flex-col gap-1 min-h-0 sm:h-full sm:overflow-y-auto">
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
              className="group grid items-center gap-x-2 gap-y-1 py-1.5 px-2 rounded hover:bg-gray-800/40 transition-colors grid-cols-[1fr_auto] sm:grid-cols-[auto_1fr_auto]"
            >
              <div className="flex gap-1 col-start-2 row-start-2 justify-self-end sm:col-start-1 sm:row-start-1 sm:justify-self-start">
                <button
                  type="button"
                  onClick={() => setInvoiceFor(recurring)}
                  className={cn(
                    "w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer sm:opacity-60 sm:group-hover:opacity-100",
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
                  className="w-6 h-6 bg-gray-700/80 hover:bg-gray-600 rounded flex items-center justify-center transition-colors cursor-pointer sm:opacity-60 sm:group-hover:opacity-100"
                  title="Modifier"
                >
                  <Edit2 className="w-3 h-3 text-gray-300" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(recurring.ID)}
                  className="w-6 h-6 bg-gray-700/80 hover:bg-red-600 rounded flex items-center justify-center transition-colors cursor-pointer sm:opacity-60 sm:group-hover:opacity-100"
                  title="Supprimer"
                >
                  <Trash2 className="w-3 h-3 text-gray-300 group-hover:text-white" />
                </button>
              </div>
              <span
                className="text-gray-200 text-sm min-w-0 truncate col-start-1 row-start-1 sm:col-start-2"
                title={recurring.label}
              >
                {recurring.label}
              </span>
              <span className="text-gray-100 text-sm min-w-[70px] text-right tabular-nums col-start-2 row-start-1 sm:col-start-3">
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
        </div>
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
