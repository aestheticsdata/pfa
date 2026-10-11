import Spinner from "@components/common/Spinner";
import { Button } from "@components/ui/button";
import useTranslations from "@i18n/useTranslations";

interface ReceiptLinesStatusProps {
  /** Shown under the spinner while loading. */
  message?: string;
  /** Set when loading failed: shows the error, with a retry when given. */
  onRetry?: () => void;
  isError?: boolean;
}

/** The modal's body while the lines load or the OCR runs, or when either failed (PFA-214). */
const ReceiptLinesStatus = ({ message, onRetry, isError = false }: ReceiptLinesStatusProps) => {
  const { receiptLines: t } = useTranslations("spendings");

  return (
    <div className="grid min-h-60 place-items-center content-center gap-3 text-center text-sm text-ink-3">
      {isError ? <p className="text-neg">{t.readFailed}</p> : <Spinner />}
      {!isError && message}
      {isError && onRetry && (
        <Button
          type="button"
          variant="muted"
          onClick={onRetry}
        >
          {t.retry}
        </Button>
      )}
    </div>
  );
};

export default ReceiptLinesStatus;
