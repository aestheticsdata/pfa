"use client";

import { CardTitle } from "@components/shared/CardSectionHeader";
import { EmptyState } from "@components/shared/EmptyState";
import GlowCard from "@components/shared/GlowCard";
import { IconButton } from "@components/shared/IconButton";
import { MoneyAmount } from "@components/shared/MoneyAmount";
import { Overline } from "@components/shared/Overline";
import SpendingModal from "@components/spendings/common/spendingModal/SpendingModal";
import InvoiceModal from "@components/spendings/invoiceModal/InvoiceModal";
import useReccurings from "@components/spendings/services/useReccurings";
import useSpendingDayItem from "@components/spendings/spendingDayItem/spendingItem/helpers/useSpendingDayItem";
import { euro } from "@lib/format";
import { cn } from "@lib/utils";
import dashboardText from "@text/dashboard";
import format from "date-fns/format";
import getDate from "date-fns/getDate";
import isSameMonth from "date-fns/isSameMonth";
import fr from "date-fns/locale/fr";
import parseISO from "date-fns/parseISO";
import { ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";
import type { RecurringItem } from "@components/spendings/types";

interface FixedExpensesProps {
  month: MonthRange;
}

// invoicefile is returned by the API but not (yet) in RecurringItemSchema
const hasInvoice = (r: RecurringItem) => Boolean((r as { invoicefile?: string | null }).invoicefile);

// échéance day-of-month = day of the recurring's dateFrom (best real proxy;
// recurrings carry no dedicated charge-day field).
const dayOf = (r: RecurringItem): number | null => {
  const d = getDate(parseISO(r.dateFrom));
  return Number.isNaN(d) ? null : d;
};

/** Fixed expenses (recurrings) — monthly/annualised totals + échéancier list. */
const FixedExpenses = ({ month }: FixedExpensesProps) => {
  const { recurrings, deleteRecurring, error } = useReccurings();
  const { isModalVisible, spending, isEditing, addSpending, closeModal, editSpending } = useSpendingDayItem();
  const [invoiceFor, setInvoiceFor] = useState<RecurringItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const { fixedExpenses: t } = dashboardText;

  if (error) throw error;

  const now = new Date();
  const viewingCurrentMonth = isSameMonth(month.start, now);
  const todayDay = getDate(now);

  const list = [...(recurrings ?? [])].sort((a, b) => (dayOf(a) ?? 99) - (dayOf(b) ?? 99));
  const total = list.reduce((a, r) => a + Number(r.amount), 0);

  const upcoming = viewingCurrentMonth
    ? list.filter((r) => {
        const d = dayOf(r);
        return d != null && d > todayDay;
      })
    : [];
  const upcomingSum = upcoming.reduce((a, r) => a + Number(r.amount), 0);

  return (
    <GlowCard
      as="section"
      className="flex max-h-[550px] min-h-[320px] flex-col gap-4 px-6 py-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <CardTitle>{t.title}</CardTitle>
          <span className="text-xs text-ink-4">
            {t.linesSchedule(list.length, format(month.start, "MMMM", { locale: fr }))}
          </span>
        </div>
        <IconButton
          variant="bordered"
          size={8}
          onClick={addSpending}
          aria-label={t.addAria}
          className="hover:border-accent-d"
        >
          <Plus />
        </IconButton>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <Overline>{t.monthly}</Overline>
          <div className="num text-2xl font-medium tracking-tight text-ink">
            <MoneyAmount
              value={total}
              decimalClassName="text-lg"
            />
          </div>
        </div>
        <div className="text-right">
          <Overline>{t.annualized}</Overline>
          <div className="num text-lg font-medium tracking-normal text-ink-2">
            <MoneyAmount
              value={total * 12}
              decimalClassName="text-sm"
            />
          </div>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-line-soft bg-surface-hi px-3 py-2.5 text-xs text-ink-3">
          <span>{t.upcomingBy(format(month.end, "d MMMM", { locale: fr }))}</span>
          <span className="text-ink-2">
            <span className="num font-semibold text-accent-strong">{upcoming.length}</span> prélèvements ·{" "}
            <span className="num font-semibold text-accent-strong">{euro(upcomingSum)} €</span>
          </span>
        </div>
      )}

      <div className="recurrings-list-container flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
        {list.map((r) => {
          if (pendingDelete === r.ID) {
            return (
              <div
                key={r.ID}
                className="flex items-center gap-2 rounded-md border border-danger-border-soft bg-danger-surface px-2.5 py-2 text-sm"
              >
                <span className="flex-1 truncate text-ink">{t.deleteConfirm}</span>
                <button
                  type="button"
                  onClick={() => setPendingDelete(null)}
                  className="rounded border border-line bg-surface-hi px-2 py-1 text-xs text-ink-2 hover:text-ink"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteRecurring.mutate({ recurring: r });
                    setPendingDelete(null);
                  }}
                  className="rounded bg-danger-solid px-2 py-1 text-xs text-on-danger hover:brightness-110"
                >
                  {t.confirm}
                </button>
              </div>
            );
          }
          const day = dayOf(r);
          const isUpcoming = viewingCurrentMonth && day != null && day > todayDay;
          return (
            <div
              key={r.ID}
              className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 border-b border-line-soft py-2.5 last:border-b-0"
            >
              <span
                className="truncate text-sm text-ink"
                title={r.label}
              >
                {r.label}
              </span>
              <span className="flex items-center gap-2">
                <span className="flex gap-1 opacity-100 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
                  <IconButton
                    variant="bordered"
                    size={6}
                    onClick={() => setInvoiceFor(r)}
                    title={t.invoiceTitle}
                    className={cn(
                      hasInvoice(r) &&
                        "border-accent-strong bg-accent-strong text-[oklch(0.18_0.01_148)] hover:text-[oklch(0.18_0.01_148)]",
                    )}
                  >
                    <ImageIcon />
                  </IconButton>
                  <IconButton
                    variant="bordered"
                    size={6}
                    onClick={() => editSpending(r)}
                    title={t.editTitle}
                  >
                    <Pencil />
                  </IconButton>
                  <IconButton
                    variant="danger"
                    size={6}
                    onClick={() => setPendingDelete(r.ID)}
                    title={t.deleteTitle}
                  >
                    <Trash2 />
                  </IconButton>
                </span>
                {day != null && (
                  <span
                    className={cn(
                      "num w-5 text-right text-2xs tabular-nums",
                      isUpcoming ? "text-accent-strong" : "text-ink-4",
                    )}
                  >
                    {String(day).padStart(2, "0")}
                  </span>
                )}
                <span className="num min-w-[76px] text-right text-sm font-medium text-ink">{euro(r.amount)} €</span>
              </span>
            </div>
          );
        })}
        {list.length === 0 && <EmptyState>{t.empty}</EmptyState>}
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
    </GlowCard>
  );
};

export default FixedExpenses;
