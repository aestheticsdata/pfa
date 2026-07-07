"use client";

import { useState } from "react";
import { ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import useReccurings from "@components/spendings/services/useReccurings";
import useSpendingDayItem from "@components/spendings/spendingDayItem/spendingItem/helpers/useSpendingDayItem";
import SpendingModal from "@components/spendings/common/spendingModal/SpendingModal";
import InvoiceModal from "@components/spendings/invoiceModal/InvoiceModal";
import { euro } from "@components/overview/format";
import { cn } from "@lib/utils";

import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";
import type { RecurringItem } from "@components/spendings/types";

interface FixedExpensesProps {
  month: MonthRange;
}

// invoicefile is returned by the API but not (yet) in RecurringItemSchema
const hasInvoice = (r: RecurringItem) =>
  Boolean((r as { invoicefile?: string | null }).invoicefile);

/** Fixed expenses (recurrings) — total + list with create/edit/delete/invoice. */
const FixedExpenses = ({ month }: FixedExpensesProps) => {
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

  if (error) throw error;

  const list = recurrings ?? [];
  const total = list.reduce((a, r) => a + Number(r.amount), 0);

  return (
    <section className="pfa-card flex h-full flex-col gap-4 px-6 py-5">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-4">
            Dépenses fixes
          </span>
          <div className="num text-[26px] font-medium tracking-[-0.02em] text-ink">
            {euro(total)} <span className="text-[17px] text-ink-3">€</span>
          </div>
          <div className="text-xs text-ink-3">≈ {euro(total * 12)} € / an</div>
        </div>
        <button
          type="button"
          onClick={addSpending}
          aria-label="Ajouter une dépense fixe"
          className="grid size-8 place-items-center rounded-lg border border-line bg-bg-hi text-ink-2 transition-colors hover:border-accent-d hover:text-ink"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="recurrings-list-container flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {list.map((r) => {
          if (pendingDelete === r.ID) {
            return (
              <div
                key={r.ID}
                className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm"
                style={{
                  background:
                    "color-mix(in oklch, var(--neg) 15%, var(--bg-elev))",
                  border:
                    "1px solid color-mix(in oklch, var(--neg) 55%, transparent)",
                }}
              >
                <span className="flex-1 truncate text-ink">Supprimer&nbsp;?</span>
                <button
                  type="button"
                  onClick={() => setPendingDelete(null)}
                  className="rounded border border-line bg-bg-hi px-2 py-1 text-xs text-ink-2 hover:text-ink"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteRecurring.mutate({ recurring: r });
                    setPendingDelete(null);
                  }}
                  className="rounded bg-[oklch(0.6_0.23_25)] px-2 py-1 text-xs text-[oklch(0.99_0.01_25)]"
                >
                  Confirmer
                </button>
              </div>
            );
          }
          return (
            <div
              key={r.ID}
              className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 rounded-md px-2 py-1.5 transition-colors hover:bg-bg-hi"
            >
              <span className="truncate text-sm text-ink" title={r.label}>
                {r.label}
              </span>
              <span className="flex items-center gap-2">
                <span className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setInvoiceFor(r)}
                    title="Facture"
                    className={cn(
                      "grid size-6 place-items-center rounded border border-line",
                      hasInvoice(r)
                        ? "bg-accent-strong text-[oklch(0.18_0.01_148)]"
                        : "bg-bg-hi text-ink-3 hover:text-ink",
                    )}
                  >
                    <ImageIcon className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => editSpending(r)}
                    title="Modifier"
                    className="grid size-6 place-items-center rounded border border-line bg-bg-hi text-ink-3 hover:text-ink"
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(r.ID)}
                    title="Supprimer"
                    className="grid size-6 place-items-center rounded border border-line bg-bg-hi text-ink-3 hover:text-neg"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </span>
                <span className="num min-w-[64px] text-right text-sm text-ink">
                  {euro(r.amount)} €
                </span>
              </span>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="py-6 text-center text-[12.5px] text-ink-4">
            Aucune dépense fixe ce mois.
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
    </section>
  );
};

export default FixedExpenses;
