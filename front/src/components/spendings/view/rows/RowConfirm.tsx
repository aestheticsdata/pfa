import { ROW_CONFIRM_TONE } from "@components/spendings/config/constants";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";

import type { RowConfirmTone } from "@components/spendings/interfaces/spendingGroupTypes";

interface RowConfirmProps {
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  /** Red for a delete (default), neutral for a reversible change like ungrouping (PFA-190). */
  tone?: RowConfirmTone;
}

/** The inline "are you sure?" bar that replaces a day-card row's content. */
const RowConfirm = ({ message, onCancel, onConfirm, tone = ROW_CONFIRM_TONE.danger }: RowConfirmProps) => {
  const spendings = useTranslations("spendings");
  const isDanger = tone === ROW_CONFIRM_TONE.danger;

  return (
    <div
      data-row-controls
      data-testid="row-confirm"
      className={cn(
        "relative z-10 col-span-full flex items-center gap-3 rounded-lg border py-2 pl-3.75 pr-2.5",
        isDanger
          ? "border-danger-border-soft bg-danger-surface shadow-[0_6px_20px_oklch(0.3_0.16_25/0.28)]"
          : "border-line bg-surface-hi shadow-float",
      )}
      role="alertdialog"
      aria-label={isDanger ? spendings.txRow.deleteAria : spendings.txRow.confirmAria}
    >
      <span className="flex-auto text-sm font-medium text-ink">{message}</span>
      <span className="flex shrink-0 gap-2">
        <button
          type="button"
          className="cursor-pointer rounded-md border border-line bg-surface-hi px-3.75 py-1.75 text-sm font-semibold text-ink-2 transition duration-100 hover:border-ink-4 hover:bg-surface-hover hover:text-ink"
          onClick={onCancel}
        >
          {spendings.actions.cancel}
        </button>
        <button
          type="button"
          data-testid="row-confirm-ok"
          className={cn(
            "cursor-pointer rounded-md border px-3.75 py-1.75 text-sm font-semibold transition duration-100 hover:brightness-[1.08]",
            isDanger
              ? "border-danger-solid bg-danger-solid text-on-danger"
              : "border-accent-strong bg-accent-strong text-primary-foreground",
          )}
          onClick={onConfirm}
        >
          {spendings.actions.confirm}
        </button>
      </span>
    </div>
  );
};

export default RowConfirm;
