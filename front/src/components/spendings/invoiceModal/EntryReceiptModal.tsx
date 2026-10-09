"use client";

import { DAY_ENTRY_KIND } from "@components/spendings/config/constants";
import GroupLinesList from "@components/spendings/invoiceModal/GroupLinesList";
import InvoiceModal from "@components/spendings/invoiceModal/InvoiceModal";
import SharedEntriesList from "@components/spendings/invoiceModal/SharedEntriesList";
import useReceiptShares from "@components/spendings/services/useReceiptShares";
import useSpendingGroups from "@components/spendings/services/useSpendingGroups";
import useTranslations from "@i18n/useTranslations";

import type { ReceiptModalHeader } from "@components/spendings/interfaces/receiptModalTypes";
import type { DayEntry } from "@components/spendings/interfaces/spendingGroupTypes";
import type { ReactNode } from "react";

interface EntryReceiptModalProps {
  entry: DayEntry;
  onClose: () => void;
}

const PANEL_HEAD = "mb-2 flex items-baseline justify-between text-2xs font-medium uppercase tracking-widest text-ink-4";

/**
 * The receipt modal of a day-card row (PFA-189). A plain spending opens the
 * usual modal; a group shows its lines under the header; a receipt shared by
 * several rows shows them, each detachable, and its upload / delete covers
 * them all.
 */
const EntryReceiptModal = ({ entry, onClose }: EntryReceiptModalProps) => {
  const { groups: t } = useTranslations("spendings");
  const sharesOf = useReceiptShares();
  const { detachReceipt } = useSpendingGroups();

  const sharers = sharesOf(entry.invoicefile);
  const isShared = sharers.length > 1;
  const isGroup = entry.kind === DAY_ENTRY_KIND.group;
  // The receipt is read and deleted through one of its spendings; the backend
  // applies a delete or a replacement to every row holding the file.
  const spending = isGroup ? entry.lines[0] : entry.spending;

  const detach = (target: DayEntry) => {
    detachReceipt.mutate(target.spendingIDs);
    // One sharer left (or this row gone): there is no shared receipt to show any more.
    if (target.ID === entry.ID || sharers.length <= 2) {
      onClose();
    }
  };

  let header: ReceiptModalHeader | undefined;
  let uploadSpendingIDs: string[] | undefined;
  let deleteLabel: string | undefined;
  let panel: ReactNode = null;

  if (isShared) {
    header = {
      title: t.receipt.sharedTitle,
      tag: t.receipt.sharedTag(sharers.length),
      tagClassName: "bg-elec/18 text-elec",
      amount: sharers.reduce((sum, s) => sum + s.amount, 0),
    };
    uploadSpendingIDs = sharers.flatMap((s) => s.spendingIDs);
    deleteLabel = t.receipt.deleteShared(sharers.length);
    panel = (
      <div className="mx-5.5 mb-4">
        <div className={PANEL_HEAD}>
          <span>{t.receipt.covers(sharers.length)}</span>
        </div>
        <SharedEntriesList
          entries={sharers}
          onDetach={detach}
        />
      </div>
    );
  } else if (isGroup) {
    header = {
      title: entry.label,
      tag: t.receipt.groupTag,
      tagClassName: "bg-surface-hi text-ink-3",
      amount: entry.amount,
    };
    uploadSpendingIDs = entry.spendingIDs;
    deleteLabel = t.receipt.deleteGroup;
    panel = (
      <div className="mx-5.5 mb-4">
        <div className={PANEL_HEAD}>
          <span>{t.receipt.ticketDetail}</span>
          <span>{t.receipt.linesCount(entry.lines.length)}</span>
        </div>
        <GroupLinesList lines={entry.lines} />
      </div>
    );
  }

  return (
    <InvoiceModal
      handleClickOutside={onClose}
      spending={spending}
      header={header}
      uploadSpendingIDs={uploadSpendingIDs}
      deleteLabel={deleteLabel}
    >
      {panel}
    </InvoiceModal>
  );
};

export default EntryReceiptModal;
