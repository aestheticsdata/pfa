"use client";

import { IconButton } from "@components/shared/IconButton";
import { GROUP_ROW_ACTION, ROW_CONFIRM_TONE } from "@components/spendings/config/constants";
import { categorySplit, entryPill } from "@components/spendings/helpers/dayEntries";
import EntryReceiptModal from "@components/spendings/invoiceModal/EntryReceiptModal";
import useSpendingGroups from "@components/spendings/services/useSpendingGroups";
import useEntryRowState from "@components/spendings/view/hooks/useEntryRowState";
import CategorySplitBar from "@components/spendings/view/rows/CategorySplitBar";
import GroupSubLine from "@components/spendings/view/rows/GroupSubLine";
import GroupToggle from "@components/spendings/view/rows/GroupToggle";
import ReceiptMark from "@components/spendings/view/rows/ReceiptMark";
import RowConfirm from "@components/spendings/view/rows/RowConfirm";
import { rowStateClass, TX_ROW } from "@components/spendings/view/rows/rowClasses";
import SelectBox from "@components/spendings/view/rows/SelectBox";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { ImageIcon, Pencil, Trash2, Ungroup } from "lucide-react";
import { useState } from "react";

import type { GroupDayEntry, GroupRowAction } from "@components/spendings/interfaces/spendingGroupTypes";

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
  // Delete and ungroup both ask inline first (PFA-190); one at a time.
  const [pending, setPending] = useState<GroupRowAction | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const { deleteGroup, ungroup } = useSpendingGroups();
  const row = useEntryRowState(entry, dayIso);

  const hasInvoice = Boolean(entry.invoicefile);

  return (
    // The block carries the row separator: its first child is the group row,
    // whose own `first:border-t-0` would otherwise always drop it (PFA-192).
    <div
      data-testid="group-row"
      className="border-t border-line-soft first:border-t-0"
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: a click anywhere on the row folds it (or ticks it); the count button and the tick are the keyboard path */}
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
        className={cn(TX_ROW, "cursor-pointer border-t-0", rowStateClass(row))}
      >
        {pending ? (
          <RowConfirm
            message={
              pending === GROUP_ROW_ACTION.delete
                ? t.deleteConfirm(entry.lines.length)
                : t.ungroupConfirm(entry.lines.length)
            }
            tone={pending === GROUP_ROW_ACTION.delete ? ROW_CONFIRM_TONE.danger : ROW_CONFIRM_TONE.neutral}
            onCancel={() => setPending(null)}
            onConfirm={() => {
              if (pending === GROUP_ROW_ACTION.delete) deleteGroup.mutate(entry.ID);
              else ungroup.mutate(entry.ID);
              setPending(null);
            }}
          />
        ) : (
          <>
            {/* Same grid and pill position as a plain spending (PFA-192): the
                count after the name is the fold toggle, not a left chevron. */}
            <span className="relative z-10 flex min-w-0 items-center gap-2.5 text-sm text-ink max-md:col-start-1 max-md:row-start-1 max-md:text-base">
              <SelectBox
                isVisible={row.isSelecting}
                checked={row.isSelected}
                onToggle={row.toggle}
              />
              <span
                className="h-5.5 w-0.75 shrink-0 rounded-xs"
                style={{ background: entryPill(entry) }}
              />
              <span
                className="truncate"
                title={entry.label}
              >
                {entry.label}
              </span>
              <GroupToggle
                count={entry.lines.length}
                open={open}
                onToggle={() => setOpen((v) => !v)}
              />
              {hasInvoice && <ReceiptMark shareCount={row.shareCount} />}
            </span>

            <span className="relative z-10 justify-self-end max-md:col-start-1 max-md:row-start-2 max-md:justify-self-start">
              <CategorySplitBar shares={categorySplit(entry.lines)} />
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
                  onClick={() => setPending(GROUP_ROW_ACTION.ungroup)}
                >
                  <Ungroup />
                </IconButton>
                <IconButton
                  variant="danger"
                  size={7}
                  data-testid="group-delete"
                  title={item.actions.delete}
                  onClick={() => setPending(GROUP_ROW_ACTION.delete)}
                >
                  <Trash2 />
                </IconButton>
              </span>
            )}
          </>
        )}
      </div>

      {open && (
        <div className="-mt-0.5 mb-2.5 ml-3.75">
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
