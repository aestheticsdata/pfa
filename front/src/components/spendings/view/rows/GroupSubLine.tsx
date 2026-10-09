import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import { TAG_CHIP } from "@components/spendings/view/helpers/tagChipClass";
import useFormat from "@i18n/useFormat";
import { cn } from "@lib/utils";

import type { SpendingItem } from "@components/spendings/interfaces/spendingListTypes";

interface GroupSubLineProps {
  line: SpendingItem;
}

/**
 * One line of an unfolded group: read-only, indented to the group's label, a
 * small category square before its detail (PFA-192).
 */
const GroupSubLine = ({ line }: GroupSubLineProps) => {
  const { euro } = useFormat();
  const color = line.categoryColor || CATEGORY_FALLBACK;

  return (
    <div
      data-testid="group-sub-line"
      data-spending-id={line.ID}
      className="grid animate-sub-line-in grid-cols-[minmax(0,1fr)_auto_78px] items-center gap-3 py-1.25 text-compact text-ink-2 max-md:grid-cols-[minmax(0,1fr)_auto]"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          className="size-1.5 shrink-0 rounded-xs"
          style={{ background: color }}
        />
        <span className="truncate">{line.detail || line.category || line.label}</span>
      </span>
      <span className="justify-self-end max-md:hidden">
        {line.category && (
          <span
            className={cn(TAG_CHIP, "px-1.5 py-0.5")}
            style={{ color }}
          >
            {line.category}
          </span>
        )}
      </span>
      <span className="justify-self-end whitespace-nowrap text-right font-mono text-compact tabular-nums">
        {euro(line.amount)}
        <span className="text-xs text-ink-3"> €</span>
      </span>
    </div>
  );
};

export default GroupSubLine;
