"use client";

import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import { IconButton } from "@components/shared/IconButton";
import { entryPill } from "@components/spendings/helpers/dayEntries";
import EntryReceiptModal from "@components/spendings/invoiceModal/EntryReceiptModal";
import useSpendingGroups from "@components/spendings/services/useSpendingGroups";
import useEntryRowState from "@components/spendings/view/hooks/useEntryRowState";
import GroupCount from "@components/spendings/view/rows/GroupCount";
import GroupSubLine from "@components/spendings/view/rows/GroupSubLine";
import ReceiptMark from "@components/spendings/view/rows/ReceiptMark";
import RowDeleteConfirm from "@components/spendings/view/rows/RowDeleteConfirm";
import { rowStateClass, TX_ROW } from "@components/spendings/view/rows/rowClasses";
import SelectBox from "@components/spendings/view/rows/SelectBox";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { ChevronRight, ImageIcon, Pencil, Trash2, Ungroup } from "lucide-react";
import { useState } from "react";

import type { GroupDayEntry } from "@components/spendings/interfaces/spendingGroupTypes";

interface SpendingGroupRowProps {
  entry: GroupDayEntry;
  dayIso: string;
  onEdit: (group: GroupDayEntry) => void;
}

/**
 * A group (PFA-189) as one collapsible day-card row: chevron, stacked colour
 * pill, name + line count, category dots, total. Clicking the row unfolds its
 * lines; hover actions are receipt / edit / ungroup / delete.
 */
const SpendingGroupRow = ({ entry, dayIso, onEdit }: SpendingGroupRowProps) => {
  const { euro } = useFormat();
  const spendings = useTranslations("spendings");
  const { groups: t, txRow, item } = spendings;
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const { deleteGroup, ungroup } = useSpendingGroups();
  const row = useEntryRowState(entry, dayIso);

  const categories = [
    ...new Map(entry.lines.map((l) => [l.category ?? "", l.categoryColor || CATEGORY_FALLBACK])).entries(),
  ];
  const hasInvoice = Boolean(entry.invoicefile);

  return (
    <div data-testid="group-row">
      {/* biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: a click anywhere on the row folds it (or ticks it); the chevron and the tick are the keyboard path */}
      <div
        data-group-id={entry.ID}
        data-selected={row.isSelected}
        onClick={(e) => {
          // The hover actions and the delete bar sit inside the row: their
          // clicks must not fold / unfold it.
          if ((e.target as HTMLElement).closest("[data-row-controls]")) return;
          if (row.isSelecting) row.toggle();
          else setOpen((v) => !v);
        }}
        onPointerEnter={row.onPointerEnter}
        onPointerLeave={row.onPointerLeave}
        className={cn(TX_ROW, "cursor-pointer", rowStateClass(row))}
      >
        {confirming ? (
          <RowDeleteConfirm
            message={t.deleteConfirm(entry.lines.length)}
            onCancel={() => setConfirming(false)}
            onConfirm={() => {
              deleteGroup.mutate(entry.ID);
              setConfirming(false);
            }}
          />
        ) : (
          <>
            <span className="relative z-10 flex min-w-0 items-center gap-2 text-sm text-ink max-md:col-start-1 max-md:row-start-1">
              {row.isSelecting && (
                <SelectBox
                  checked={row.isSelected}
                  onToggle={row.toggle}
                />
              )}
              <button
                type="button"
                data-testid="group-toggle"
                aria-label={open ? t.collapseAria : t.expandAria}
                aria-expanded={open}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((v) => !v);
                }}
                className="grid size-5 shrink-0 cursor-pointer place-items-center rounded-sm text-ink-4 hover:text-ink"
              >
                <ChevronRight
                  className={cn("size-3 transition-transform duration-150", open && "rotate-90")}
                  strokeWidth={2.5}
                />
              </button>
              <span
                className="h-7.5 w-0.75 shrink-0 rounded-xs"
                style={{ background: entryPill(entry) }}
              />
              <span className="flex min-w-0 flex-col">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    className="truncate font-medium"
                    title={entry.label}
                  >
                    {entry.label}
                  </span>
                  <GroupCount count={entry.lines.length} />
                  {hasInvoice && <ReceiptMark shareCount={row.shareCount} />}
                </span>
                {!open && (
                  <span className="truncate text-xs text-ink-4">
                    {categories.map(([name]) => name || spendings.noCategory).join(" · ")}
                  </span>
                )}
              </span>
            </span>

            <span className="relative z-10 flex gap-0.75 justify-self-end max-md:col-start-1 max-md:row-start-2 max-md:justify-self-start">
              {categories.map(([name, color]) => (
                <i
                  key={name}
                  className="size-2 rounded-xs"
                  style={{ background: color }}
                />
              ))}
            </span>

            <span className="relative z-10 justify-self-end whitespace-nowrap text-right font-mono text-sm font-medium tabular-nums text-ink max-md:col-start-2 max-md:row-start-1 max-md:self-center">
              {euro(entry.amount)}
              <span className="text-xs font-normal text-ink-3"> €</span>
            </span>

            {!row.isSelecting && (
              <span
                data-row-controls
                className="absolute right-22 top-1/2 z-20 hidden -translate-y-1/2 items-center gap-1.5 bg-[linear-gradient(90deg,transparent,var(--surface-hi)_26px)] pl-7.5 group-hover:flex max-md:static max-md:col-start-2 max-md:row-start-2 max-md:flex max-md:translate-y-0 max-md:justify-self-end max-md:bg-none max-md:p-0"
              >
                <IconButton
                  variant="bordered"
                  size={7}
                  data-testid="group-receipt"
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
                  data-testid="group-edit"
                  title={item.actions.edit}
                  onClick={() => onEdit(entry)}
                >
                  <Pencil />
                </IconButton>
                <IconButton
                  variant="bordered"
                  size={7}
                  data-testid="group-ungroup"
                  title={t.ungroup}
                  onClick={() => ungroup.mutate(entry.ID)}
                >
                  <Ungroup />
                </IconButton>
                <IconButton
                  variant="danger"
                  size={7}
                  data-testid="group-delete"
                  title={item.actions.delete}
                  onClick={() => setConfirming(true)}
                >
                  <Trash2 />
                </IconButton>
              </span>
            )}
          </>
        )}
      </div>

      {open && (
        <div className="mb-1.5 ml-2 border-l border-line pl-3.5">
          {entry.lines.map((line) => (
            <GroupSubLine
              key={line.ID}
              line={line}
            />
          ))}
        </div>
      )}

      {invoiceOpen && (
        <EntryReceiptModal
          entry={entry}
          onClose={() => setInvoiceOpen(false)}
        />
      )}
    </div>
  );
};

export default SpendingGroupRow;
