import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { Check } from "lucide-react";

interface SelectBoxProps {
  checked: boolean;
  onToggle: () => void;
}

/**
 * The tick in front of a row while its card is in selection mode (PFA-189) —
 * the keyboard path; a click anywhere on the row does the same.
 */
const SelectBox = ({ checked, onToggle }: SelectBoxProps) => {
  const { groups: t } = useTranslations("spendings");

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
        "grid size-4 shrink-0 cursor-pointer place-items-center rounded-sm border-[1.5px] transition-colors",
        checked ? "border-accent-strong bg-accent-strong text-primary-foreground" : "border-ink-5",
      )}
    >
      {checked && (
        <Check
          className="size-2.5"
          strokeWidth={3.2}
        />
      )}
    </button>
  );
};

export default SelectBox;
