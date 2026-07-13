"use client";

import { useState } from "react";
import parseISO from "date-fns/parseISO";
import getDate from "date-fns/getDate";
import isSameMonth from "date-fns/isSameMonth";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import { ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import useReccurings from "@components/spendings/services/useReccurings";
import useSpendingDayItem from "@components/spendings/spendingDayItem/spendingItem/helpers/useSpendingDayItem";
import SpendingModal from "@components/spendings/common/spendingModal/SpendingModal";
import InvoiceModal from "@components/spendings/invoiceModal/InvoiceModal";
import { euro } from "@components/dashboard/format";
import { cn } from "@lib/utils";

import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";
import type { RecurringItem } from "@components/spendings/types";

interface FixedExpensesProps {
  month: MonthRange;
}

// invoicefile is returned by the API but not (yet) in RecurringItemSchema
const hasInvoice = (r: RecurringItem) =>
  Boolean((r as { invoicefile?: string | null }).invoicefile);

// échéance day-of-month = day of the recurring's dateFrom (best real proxy;
// recurrings carry no dedicated charge-day field).
const dayOf = (r: RecurringItem): number | null => {
  const d = getDate(parseISO(r.dateFrom));
  return Number.isNaN(d) ? null : d;
};

/** Fixed expenses (recurrings) — monthly/annualised totals + échéancier list. */
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

  const now = new Date();
  const viewingCurrentMonth = isSameMonth(month.start, now);
  const todayDay = getDate(now);

  const list = [...(recurrings ?? [])].sort(
    (a, b) => (dayOf(a) ?? 99) - (dayOf(b) ?? 99),
  );
  const total = list.reduce((a, r) => a + Number(r.amount), 0);
  const [totalInt, totalDec] = euro(total).split(",");
  const [annualInt, annualDec] = euro(total * 12).split(",");

  const upcoming = viewingCurrentMonth
    ? list.filter((r) => {
        const d = dayOf(r);
        return d != null && d > todayDay;
      })
    : [];
  const upcomingSum = upcoming.reduce((a, r) => a + Number(r.amount), 0);

  return (
    <section className="pfa-card flex max-h-[550px] min-h-[320px] flex-col gap-4 px-6 py-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Dépenses fixes
          </h2>
          <span className="text-xs text-ink-4">
            {list.length} lignes · échéancier {format(month.start, "MMMM", { locale: fr })}
          </span>
        </div>
        <button
          type="button"
          onClick={addSpending}
          aria-label="Ajouter une dépense fixe"
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-bg-hi text-ink-2 transition-colors hover:border-accent-d hover:text-ink"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-4">
            Mensuel
          </div>
          <div className="num text-[26px] font-medium tracking-[-0.02em] text-ink">
            {totalInt}
            <span className="text-[18px] text-ink-3">,{totalDec} €</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-4">
            Annualisé
          </div>
          <div className="num text-[18px] font-medium tracking-[-0.01em] text-ink-2">
            {annualInt}
            <span className="text-[14px] text-ink-3">,{annualDec} €</span>
          </div>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-line-soft bg-bg-hi px-3 py-2.5 text-xs text-ink-3">
          <span>À venir d&apos;ici le {format(month.end, "d MMMM", { locale: fr })}</span>
          <span className="text-ink-2">
            <span className="num font-semibold text-accent-strong">
              {upcoming.length}
            </span>{" "}
            prélèvements ·{" "}
            <span className="num font-semibold text-accent-strong">
              {euro(upcomingSum)} €
            </span>
          </span>
        </div>
      )}

      <div className="recurrings-list-container flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
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
          const day = dayOf(r);
          const isUpcoming =
            viewingCurrentMonth && day != null && day > todayDay;
          return (
            <div
              key={r.ID}
              className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 border-b border-line-soft py-[9px] last:border-b-0"
            >
              <span className="truncate text-[13px] text-ink" title={r.label}>
                {r.label}
              </span>
              <span className="flex items-center gap-2">
                <span className="flex gap-1 opacity-100 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
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
                {day != null && (
                  <span
                    className={cn(
                      "num w-5 text-right text-[11px] tabular-nums",
                      isUpcoming ? "text-accent-strong" : "text-ink-4",
                    )}
                  >
                    {String(day).padStart(2, "0")}
                  </span>
                )}
                <span className="num min-w-[76px] text-right text-[13px] font-medium text-ink">
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
