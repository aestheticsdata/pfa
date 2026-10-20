import { Button } from "@components/ui/button";
import useTranslations from "@i18n/useTranslations";
import { Copy } from "lucide-react";

interface CopyRecurringsButtonProps {
  onCopy: () => void;
}

/**
 * "Copy last month's recurrings". A recurrings-panel affordance only (gated on the
 * recurringType prop, NOT asRecurring): it is not surfaced in the timeline "make
 * this recurring" toggle flow, where clicking it would discard the entry the user
 * is mid-creating.
 */
const CopyRecurringsButton = ({ onCopy }: CopyRecurringsButtonProps) => {
  const { modal } = useTranslations("spendings");

  return (
    <Button
      type="button"
      variant="muted"
      onClick={onCopy}
    >
      <Copy className="size-4" />
      {modal.copyPreviousMonth}
    </Button>
  );
};

export default CopyRecurringsButton;
