import GroupLineRow from "@components/spendings/common/spendingModal/group/GroupLineRow";
import { summarizeDrafts } from "@components/spendings/common/spendingModal/group/groupLineDrafts";
import { GROUP_LINE_GRID } from "@components/spendings/common/spendingModal/group/groupLineGrid";
import { Label } from "@components/ui/label";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { Plus } from "lucide-react";

import type { CategoryOption } from "@components/spendings/common/spendingModal/schema";
import type { GroupLineDraft } from "@components/spendings/interfaces/spendingGroupTypes";

interface GroupLinesFieldProps {
  drafts: GroupLineDraft[];
  invalidKeys: string[];
  categoryOptions: CategoryOption[];
  updateLine: (key: string, patch: Partial<GroupLineDraft>) => void;
  addLine: () => void;
  removeLine: (key: string) => void;
}

const COLUMN_HEAD = "text-2xs font-medium uppercase tracking-widest text-ink-4";

/** The group's lines editor, replacing Amount + Category in group mode (PFA-189). */
const GroupLinesField = ({
  drafts,
  invalidKeys,
  categoryOptions,
  updateLine,
  addLine,
  removeLine,
}: GroupLinesFieldProps) => {
  const { groups: t } = useTranslations("spendings");
  const { euro } = useFormat();
  const summary = summarizeDrafts(drafts);

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm text-ink-2">{t.lines}</Label>
      <div className={cn(GROUP_LINE_GRID, "max-md:hidden")}>
        <span className={COLUMN_HEAD}>{t.columnCategory}</span>
        <span className={COLUMN_HEAD}>
          {t.columnDetail} <span className="normal-case tracking-normal">{t.columnDetailOptional}</span>
        </span>
        <span className={cn(COLUMN_HEAD, "text-right")}>{t.columnAmount}</span>
        <span />
      </div>
      <div className="flex flex-col gap-2 max-md:gap-3.5">
        {drafts.map((draft, i) => (
          <GroupLineRow
            key={draft.key}
            draft={draft}
            isFirst={i === 0}
            isInvalid={invalidKeys.includes(draft.key)}
            canRemove={drafts.length > 1}
            categoryOptions={categoryOptions}
            onChange={updateLine}
            onRemove={removeLine}
          />
        ))}
      </div>
      <button
        type="button"
        data-testid="group-add-line"
        onClick={addLine}
        className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2.25 text-sm text-ink-3 transition-colors hover:border-accent-d hover:bg-accent-bg hover:text-accent-strong"
      >
        <Plus className="size-3" />
        {t.addLine}
      </button>
      <div className="mt-1 flex items-baseline justify-between border-t border-line-soft pt-3">
        <span className="text-sm text-ink-3">
          {t.total} · {t.linesSummary(summary.lines, summary.categories)}
        </span>
        <span
          data-testid="group-total"
          className="num text-xl font-medium text-ink"
        >
          {euro(summary.total)}
          <span className="text-sm font-normal text-ink-3"> €</span>
        </span>
      </div>
    </div>
  );
};

export default GroupLinesField;
