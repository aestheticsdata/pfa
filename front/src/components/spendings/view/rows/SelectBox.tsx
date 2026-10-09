import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { Check } from "lucide-react";

interface SelectBoxProps {
  /** Shown in selection mode only, in the card's left margin (PFA-198). */
  isVisible: boolean;
  checked: boolean;
  onToggle: () => void;
}

/**
 * The tick in front of a row while its card is in selection mode (PFA-189) —
 * the keyboard path; a click anywhere on the row does the same. It sits in
 * the margin left of the pill, so ticking never shifts the row (PFA-198).
 */
const SelectBox = ({ isVisible, checked, onToggle }: SelectBoxProps) => {
  const { groups: t } = useTranslations("spendings");

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={t.selection.selectRow}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "absolute top-1/2 -left-4.5 grid size-3 -translate-y-1/2 cursor-pointer place-items-center rounded-xs border transition-colors",
        checked ? "border-accent-strong bg-accent-strong text-primary-foreground" : "border-ink-5",
      )}
    >
      {checked && (
        <Check
          className="size-2"
          strokeWidth={3.4}
        />
      )}
    </button>
  );
};

export default SelectBox;
