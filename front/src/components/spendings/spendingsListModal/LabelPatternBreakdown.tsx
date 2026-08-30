"use client";

import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { ProgressTrack } from "@lib/dataviz";
import { cn } from "@lib/utils";

import type { LabelPatternGroup } from "@components/spendings/interfaces/labelPatternTypes";

interface LabelPatternBreakdownProps {
  /** Full ranking, biggest first, "Other" last — every group gets its row. */
  groups: LabelPatternGroup[];
  categoryColor: string;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}

/** The catch-all bucket is not a pattern — it stays out of the category colour. */
const OTHER_COLOR = "var(--ink-4)";

/**
 * "Breakdown by pattern" strip of the category detail modal (PFA-168): what the
 * money inside one category actually went on, grouped by label pattern.
 *
 * Horizontal bars rather than a donut: the groups carry text labels of varying
 * length, there are 2 to N of them with a long tail folded into "Other", and the
 * donut is already the visual language of the level above (categories).
 *
 * Clicking a row filters the day list below to that group; the bars are computed
 * from the visible spendings, never from the selection, so picking a group does
 * not send it to 100%.
 *
 * No folding: every group has its row, the strip scrolling past its height cap
 * (PFA-171 — a folded tail read as "not grouped", and "Other" must mean
 * unclassifiable, not rank six and beyond).
 */
const LabelPatternBreakdown = ({ groups, categoryColor, selectedKey, onSelect }: LabelPatternBreakdownProps) => {
  const { euro, pct1 } = useFormat();
  const { spendingsListModal } = useTranslations("spendings");

  if (groups.length === 0) {
    return null;
  }

  const t = spendingsListModal.patterns;
  // Scale against the biggest row on screen, so the widest bar is always full.
  const maxTotal = Math.max(...groups.map((group) => group.total));

  return (
    <div className="shrink-0 border-b border-line px-5.5 py-3">
      <div className="mb-1.5 flex items-center justify-between gap-3.5">
        <span className="text-2xs font-medium uppercase tracking-widest text-ink-4">{t.title}</span>
      </div>

      {/* Height-bounded with its own scroll: the strip sits above the day list
          and must not eat it. */}
      <div className="pfa-scroll-thin flex max-h-56 flex-col overflow-y-auto max-sm:max-h-40">
        {groups.map((group) => {
          const isSelected = group.key === selectedKey;
          const color = group.isOther ? OTHER_COLOR : categoryColor;
          return (
            <button
              key={group.key}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(isSelected ? null : group.key)}
              className={cn(
                "grid w-full cursor-pointer grid-cols-[10px_minmax(0,1fr)_minmax(0,1.3fr)_92px_58px] items-center gap-3.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-100 hover:bg-surface-hi max-sm:grid-cols-[10px_minmax(0,1fr)_auto_auto] max-sm:gap-x-2.5 max-sm:py-1",
                isSelected && "bg-surface-hi ring-1 ring-inset ring-elec/45",
              )}
            >
              <span
                className="size-2 rounded-xs"
                style={{ background: color }}
              />
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="truncate capitalize text-ink">{group.isOther ? t.other : group.name}</span>
                <span className="num shrink-0 rounded-full border border-line-soft bg-surface-base px-1.75 text-2xs leading-normal text-ink-3">
                  {group.count}
                </span>
              </span>
              {/* The row already reads out its name, amount and share — the bar
                  is those same numbers drawn, so it stays out of the tree. */}
              <span
                className="max-sm:hidden"
                aria-hidden
              >
                <ProgressTrack
                  animate
                  value={group.total}
                  max={maxTotal}
                  color={color}
                  height={6}
                  radius={4}
                />
              </span>
              <span className="num text-right text-ink">
                {euro(group.total)}
                <span className="font-normal text-ink-3"> €</span>
              </span>
              <span className="num text-right text-ink-2">{pct1(group.pct)} %</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LabelPatternBreakdown;
