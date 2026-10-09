import useTranslations from "@i18n/useTranslations";

interface RowDeleteConfirmProps {
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** The inline "delete?" bar that replaces a day-card row's content. */
const RowDeleteConfirm = ({ message, onCancel, onConfirm }: RowDeleteConfirmProps) => {
  const spendings = useTranslations("spendings");

  return (
    <div
      data-row-controls
      className="relative z-10 col-span-full flex items-center gap-3 rounded-lg border border-danger-border-soft bg-danger-surface py-2 pl-3.75 pr-2.5 shadow-[0_6px_20px_oklch(0.3_0.16_25/0.28)]"
      role="alertdialog"
      aria-label={spendings.txRow.deleteAria}
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
          className="cursor-pointer rounded-md border border-danger-solid bg-danger-solid px-3.75 py-1.75 text-sm font-semibold text-on-danger transition duration-100 hover:brightness-[1.08]"
          onClick={onConfirm}
        >
          {spendings.actions.confirm}
        </button>
      </span>
    </div>
  );
};

export default RowDeleteConfirm;
