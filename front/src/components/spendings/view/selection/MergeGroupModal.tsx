"use client";

import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import { TextInput } from "@components/shared/TextInput";
import ReceiptField from "@components/spendings/common/spendingModal/fields/ReceiptField";
import useReceiptPick from "@components/spendings/common/spendingModal/useReceiptPick";
import { suggestMerge } from "@components/spendings/helpers/dayEntries";
import { COVERAGE_ROW } from "@components/spendings/invoiceModal/coverageRow";
import useSpendingGroups from "@components/spendings/services/useSpendingGroups";
import { TAG_CHIP } from "@components/spendings/view/helpers/tagChipClass";
import BatchModal from "@components/spendings/view/selection/BatchModal";
import InfoNote from "@components/spendings/view/selection/InfoNote";
import { Label } from "@components/ui/label";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { FIELD_LIMITS } from "@src/schemas/fieldLimits";
import { useState } from "react";

import type { SelectedEntry } from "@components/spendings/interfaces/spendingGroupTypes";

interface MergeGroupModalProps {
  selection: SelectedEntry[];
  onClose: () => void;
  /** The new group's ID, once created — the page flashes its row. */
  onGrouped: (groupID: string) => void;
}

/**
 * "Group N spendings" (PFA-189): the ticked rows of one day become the lines
 * of a new group. Name and details are pre-filled from the labels; the first
 * existing receipt is kept, else one can be attached.
 */
const MergeGroupModal = ({ selection, onClose, onGrouped }: MergeGroupModalProps) => {
  const { groups: t } = useTranslations("spendings");
  const { euro } = useFormat();
  const { mergeGroup } = useSpendingGroups();
  const receipt = useReceiptPick();
  const entries = selection.map((s) => s.entry);
  const [suggestion] = useState(() => suggestMerge(entries));
  const [label, setLabel] = useState(suggestion.label.slice(0, FIELD_LIMITS.groupLabel));
  const [details, setDetails] = useState(() =>
    suggestion.lines.map((l) => l.detail.slice(0, FIELD_LIMITS.groupDetail)),
  );
  const [nameError, setNameError] = useState(false);

  const withReceipt = entries.find((e) => e.invoicefile);
  const total = suggestion.lines.reduce((sum, l) => sum + Number(l.spending.amount), 0);
  const categoryCount = new Set(suggestion.lines.map((l) => l.spending.category ?? "")).size;

  const submit = () => {
    if (!label.trim()) {
      setNameError(true);
      return false;
    }
    // mutateAsync, not mutate's callbacks: the modal is gone by the time the
    // request returns, and the page still has to drop the selection and flash.
    mergeGroup
      .mutateAsync({
        label: label.trim(),
        date: suggestion.lines[0].spending.date.slice(0, 10),
        lines: suggestion.lines.map((l, i) => ({ spendingID: l.spending.ID, detail: details[i] })),
        receiptFile: withReceipt ? null : receipt.receiptFile,
      })
      .then(onGrouped)
      .catch((e) => console.log("error grouping spendings : ", e));
    return true;
  };

  return (
    <BatchModal
      title={t.merge.title(entries.length)}
      submitLabel={t.merge.submit}
      // Same gradient as the bar's Group button (PFA-198).
      submitClassName="[background:var(--selection-group-fill)]"
      testId="merge-group-modal"
      onSubmit={submit}
      onClose={onClose}
    >
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="mergeGroupName"
          className="text-sm text-ink-2"
        >
          {t.merge.name}
        </Label>
        <TextInput
          id="mergeGroupName"
          data-testid="merge-group-name"
          value={label}
          maxLength={FIELD_LIMITS.groupLabel}
          placeholder={t.namePlaceholder}
          aria-invalid={nameError}
          onChange={(e) => {
            setLabel(e.target.value);
            setNameError(false);
          }}
          className={cn("dark:bg-surface-base", nameError && "border-neg")}
        />
        {nameError && <p className="text-xs text-neg">{t.nameRequired}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-sm text-ink-2">{t.merge.lines}</Label>
        <div className="overflow-hidden rounded-md border border-line bg-surface-base">
          {suggestion.lines.map(({ spending }, i) => {
            const color = spending.categoryColor || CATEGORY_FALLBACK;
            return (
              <div
                key={spending.ID}
                className={cn(COVERAGE_ROW, "grid-cols-[0.1875rem_minmax(0,1fr)_auto_auto]")}
              >
                <span
                  className="h-4 w-0.75 rounded-xs"
                  style={{ background: color }}
                />
                <input
                  aria-label={t.detailAria}
                  data-testid="merge-line-detail"
                  value={details[i]}
                  maxLength={FIELD_LIMITS.groupDetail}
                  onChange={(e) => setDetails((current) => current.map((d, k) => (k === i ? e.target.value : d)))}
                  className="min-w-0 rounded-sm border border-transparent bg-transparent px-1.5 py-1 text-sm text-ink outline-none transition-colors hover:border-line focus:border-accent-d"
                />
                <span>
                  {spending.category && (
                    <span
                      className={TAG_CHIP}
                      style={{ color }}
                    >
                      {spending.category}
                    </span>
                  )}
                </span>
                <span className="num text-sm text-ink">
                  {euro(spending.amount)}
                  <span className="text-xs text-ink-3"> €</span>
                </span>
              </div>
            );
          })}
          <div className="flex items-baseline justify-between border-t border-line px-3 py-2.5 text-sm text-ink-3">
            <span>{t.linesSummary(suggestion.lines.length, categoryCount)}</span>
            <span className="num text-base font-semibold text-ink">{euro(total)} €</span>
          </div>
        </div>
      </div>

      {withReceipt ? (
        <InfoNote>
          {t.merge.keptReceiptBefore} <b className="font-semibold text-ink">« {withReceipt.label} »</b>{" "}
          {t.merge.keptReceiptAfter}
        </InfoNote>
      ) : (
        <div className="flex flex-col gap-2">
          <Label className="text-sm text-ink-2">
            {t.merge.receipt} <span className="font-normal text-ink-4">{t.merge.receiptHint}</span>
          </Label>
          <ReceiptField {...receipt} />
        </div>
      )}
    </BatchModal>
  );
};

export default MergeGroupModal;
