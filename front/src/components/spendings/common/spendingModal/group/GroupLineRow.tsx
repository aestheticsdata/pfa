import { IconButton } from "@components/shared/IconButton";
import { draftAmount, isAmountExpression } from "@components/spendings/common/spendingModal/group/groupLineDrafts";
import { GROUP_LINE_GRID } from "@components/spendings/common/spendingModal/group/groupLineGrid";
import LineCategoryPicker from "@components/spendings/common/spendingModal/group/LineCategoryPicker";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { FIELD_LIMITS } from "@src/schemas/fieldLimits";
import { X } from "lucide-react";

import type { CategoryOption } from "@components/spendings/common/spendingModal/schema";
import type { GroupLineDraft } from "@components/spendings/interfaces/spendingGroupTypes";

interface GroupLineRowProps {
  draft: GroupLineDraft;
  isFirst: boolean;
  isInvalid: boolean;
  canRemove: boolean;
  categoryOptions: CategoryOption[];
  onChange: (key: string, patch: Partial<GroupLineDraft>) => void;
  onRemove: (key: string) => void;
}

/**
 * One line of the group editor: category · detail · amount · remove. The
 * amount is a wide free-text field, since it takes a sum as typed off the
 * receipt ("12+3.5+7.5"), evaluated on submit like the single amount.
 */
const GroupLineRow = ({
  draft,
  isFirst,
  isInvalid,
  canRemove,
  categoryOptions,
  onChange,
  onRemove,
}: GroupLineRowProps) => {
  const { groups: t } = useTranslations("spendings");
  const { euro } = useFormat();
  const computed = draftAmount(draft);

  return (
    <div
      data-testid="group-line"
      className={cn(GROUP_LINE_GRID, "items-center")}
    >
      <LineCategoryPicker
        categoryOptions={categoryOptions}
        category={draft.category}
        onChange={(category) => onChange(draft.key, { category })}
      />
      <input
        data-testid="group-line-detail"
        aria-label={t.detailAria}
        value={draft.detail}
        maxLength={FIELD_LIMITS.groupDetail}
        placeholder={isFirst ? t.detailPlaceholder : ""}
        onChange={(e) => onChange(draft.key, { detail: e.target.value })}
        className="h-9.5 min-w-0 rounded-md border border-line bg-surface-base px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-5 focus:border-accent-d max-md:order-first max-md:col-span-full"
      />
      <span
        className={cn(
          "flex h-9.5 min-w-0 items-baseline gap-1.5 rounded-md border bg-surface-base px-3 py-2.25 transition-colors focus-within:border-accent-d",
          isInvalid ? "border-neg" : "border-line",
        )}
      >
        <input
          data-testid="group-line-amount"
          aria-label={t.amountAria}
          aria-invalid={isInvalid}
          inputMode="decimal"
          placeholder={isFirst ? t.amountPlaceholder : "0,00"}
          title={t.amountHint}
          value={draft.amount}
          onChange={(e) => onChange(draft.key, { amount: e.target.value })}
          className="num min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-5"
        />
        {isAmountExpression(draft.amount) && (
          <span
            data-testid="group-line-result"
            className={cn(
              "num shrink-0 whitespace-nowrap text-xs",
              computed === null ? "text-neg" : "text-accent-strong",
            )}
          >
            = {computed === null ? "?" : euro(computed)}
          </span>
        )}
        <span className="num text-sm text-ink-3">€</span>
      </span>
      <IconButton
        variant="danger"
        size={7}
        title={t.removeLine}
        aria-label={t.removeLine}
        disabled={!canRemove}
        onClick={() => onRemove(draft.key)}
        className="size-7.5 disabled:cursor-not-allowed disabled:opacity-35"
      >
        <X />
      </IconButton>
    </div>
  );
};

export default GroupLineRow;
