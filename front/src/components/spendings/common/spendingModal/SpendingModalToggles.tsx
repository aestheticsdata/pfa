import Toggle from "@components/spendings/common/spendingModal/Toggle";
import useTranslations from "@i18n/useTranslations";

interface SpendingModalTogglesProps {
  /** "Monthly recurring" — only when creating a plain spending from the timeline. */
  showRecurringToggle: boolean;
  isRecurring: boolean;
  onToggleRecurring: () => void;
  /** Hidden in edit mode: the modal has no view of an existing receipt. */
  showReceiptToggle: boolean;
  isReceipt: boolean;
  onToggleReceipt: () => void;
  /** A recurring takes no receipt — the toggle stays, disabled. */
  receiptDisabled: boolean;
  isGroup: boolean;
}

/** The "Monthly recurring" and "Attach a receipt" toggles under the fields. */
const SpendingModalToggles = ({
  showRecurringToggle,
  isRecurring,
  onToggleRecurring,
  showReceiptToggle,
  isReceipt,
  onToggleReceipt,
  receiptDisabled,
  isGroup,
}: SpendingModalTogglesProps) => {
  const { modal, groups } = useTranslations("spendings");

  return (
    <div className="flex flex-wrap gap-2.5 pt-0.5">
      {showRecurringToggle && (
        <Toggle
          active={isRecurring}
          onClick={onToggleRecurring}
        >
          {modal.recurringToggle}
        </Toggle>
      )}
      {/* Receipt is not applicable to a recurring — disabled, not removed.
          In edit mode the toggle is hidden: the modal has no view of an
          existing receipt, so attaching here could silently overwrite one —
          the row's receipt icon (InvoiceModal) is the edit path. */}
      {showReceiptToggle && (
        <Toggle
          active={isReceipt}
          onClick={onToggleReceipt}
          disabled={receiptDisabled}
        >
          {isGroup ? groups.attachReceipt : modal.attachReceipt}
        </Toggle>
      )}
    </div>
  );
};

export default SpendingModalToggles;
