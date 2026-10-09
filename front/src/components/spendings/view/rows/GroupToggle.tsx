import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { ChevronDown } from "lucide-react";

interface GroupToggleProps {
  count: number;
  open: boolean;
  onToggle: () => void;
}

/** A group's line count, doubling as its fold / unfold button (PFA-192). */
const GroupToggle = ({ count, open, onToggle }: GroupToggleProps) => {
  const { groups: t } = useTranslations("spendings");

  return (
    <button
      type="button"
      data-testid="group-toggle"
      aria-label={open ? t.collapseAria : t.expandAria}
      aria-expanded={open}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "num inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-sm border bg-surface-hi py-0.5 pr-1.25 pl-1.75 text-2xs font-semibold leading-snug transition-colors",
        open ? "border-ink-4 text-ink" : "border-line text-ink-3 hover:text-ink",
      )}
    >
      {count}
      <ChevronDown
        className={cn("size-2.5 transition-transform duration-150", open && "rotate-180")}
        strokeWidth={3}
      />
    </button>
  );
};

export default GroupToggle;
