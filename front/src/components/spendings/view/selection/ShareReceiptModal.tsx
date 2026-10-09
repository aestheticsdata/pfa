"use client";

import ReceiptField from "@components/spendings/common/spendingModal/fields/ReceiptField";
import useReceiptPick from "@components/spendings/common/spendingModal/useReceiptPick";
import SharedEntriesList from "@components/spendings/invoiceModal/SharedEntriesList";
import useSpendingGroups from "@components/spendings/services/useSpendingGroups";
import BatchModal from "@components/spendings/view/selection/BatchModal";
import InfoNote from "@components/spendings/view/selection/InfoNote";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";

import type { SelectedEntry } from "@components/spendings/interfaces/spendingGroupTypes";

interface ShareReceiptModalProps {
  selection: SelectedEntry[];
  onClose: () => void;
  onShared: () => void;
}

/**
 * "Shared receipt" (PFA-189): one upload attached to every ticked row, across
 * days; the rows stay separate. A receipt they already had is replaced.
 */
const ShareReceiptModal = ({ selection, onClose, onShared }: ShareReceiptModalProps) => {
  const { groups: t } = useTranslations("spendings");
  const { euro } = useFormat();
  const { shareReceipt } = useSpendingGroups();
  const receipt = useReceiptPick();
  const entries = selection.map((s) => s.entry);
  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  const already = entries.filter((e) => e.invoicefile).length;

  const submit = () => {
    if (!receipt.receiptFile) return false;
    // mutateAsync: the modal is gone by the time the upload returns (see MergeGroupModal).
    shareReceipt
      .mutateAsync({
        spendingIDs: entries.flatMap((e) => e.spendingIDs),
        file: receipt.receiptFile,
        label: entries[0].label,
        date: entries[0].date.slice(0, 10),
      })
      .then(onShared)
      .catch((e) => console.log("error sharing a receipt : ", e));
    return true;
  };

  return (
    <BatchModal
      title={t.share.title}
      submitLabel={t.share.submit(entries.length)}
      submitDisabled={!receipt.receiptFile}
      testId="share-receipt-modal"
      onSubmit={submit}
      onClose={onClose}
    >
      <p className="text-sm text-ink-3">{t.share.lead(entries.length)}</p>
      <div className="flex flex-col">
        <SharedEntriesList entries={entries} />
        <div className="flex items-baseline justify-between px-3 pt-2.5 text-sm text-ink-3">
          <span>{t.share.count(entries.length)}</span>
          <span className="num text-base font-semibold text-ink">{euro(total)} €</span>
        </div>
      </div>
      {already > 0 && (
        <InfoNote>
          <b className="font-semibold text-ink">{t.share.already(already)}</b>
          {t.share.alreadyAfter}
        </InfoNote>
      )}
      <ReceiptField {...receipt} />
    </BatchModal>
  );
};

export default ShareReceiptModal;
