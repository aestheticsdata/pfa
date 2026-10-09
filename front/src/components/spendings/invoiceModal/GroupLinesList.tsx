import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import { COVERAGE_ROW } from "@components/spendings/invoiceModal/coverageRow";
import { TAG_CHIP } from "@components/spendings/view/helpers/tagChipClass";
import useFormat from "@i18n/useFormat";
import { cn } from "@lib/utils";

import type { SpendingItem } from "@components/spendings/interfaces/spendingListTypes";

interface GroupLinesListProps {
  lines: SpendingItem[];
}

/** pill · detail · category · amount — a group's lines, read-only (PFA-189). */
const GroupLinesList = ({ lines }: GroupLinesListProps) => {
  const { euro } = useFormat();

  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface-base">
      {lines.map((line) => {
        const color = line.categoryColor || CATEGORY_FALLBACK;
        return (
          <div
            key={line.ID}
            className={cn(COVERAGE_ROW, "grid-cols-[0.1875rem_minmax(0,1fr)_auto_auto]")}
          >
            <span
              className="h-4 w-0.75 rounded-xs"
              style={{ background: color }}
            />
            <span className="truncate text-sm text-ink-2">{line.detail || line.category || line.label}</span>
            <span>
              {line.category && (
                <span
                  className={TAG_CHIP}
                  style={{ color }}
                >
                  {line.category}
                </span>
              )}
            </span>
            <span className="num text-sm text-ink">
              {euro(line.amount)}
              <span className="text-xs text-ink-3"> €</span>
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default GroupLinesList;
