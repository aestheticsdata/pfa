"use client";

import { FilterChip } from "@components/shared/FilterChip";
import { Overline } from "@components/shared/Overline";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { FilterCategory } from "@components/spendings/interfaces/spendingCategoryFilterTypes";

interface SpendingCategoryFilterProps {
  categories: FilterCategory[];
  total: number;
  selected: string | null;
  onSelect: (key: string | null) => void;
}

const Chip = ({
  active,
  onClick,
  color,
  label,
  count,
  className,
}: {
  active: boolean;
  onClick: () => void;
  color?: string;
  label: string;
  count: number;
  className?: string;
}) => (
  <FilterChip
    active={active}
    onClick={onClick}
    className={cn("shrink-0 gap-1.5 rounded-lg px-2.5 capitalize", className)}
  >
    {color && (
      <span
        className="size-2 shrink-0 rounded-xs"
        style={{ background: color }}
      />
    )}
    {label}
    <span className={cn("num text-2xs", active ? "text-accent-strong/80" : "text-ink-4")}>{count}</span>
  </FilterChip>
);

/**
 * Global category filter for the Spendings timeline (null = all). Boxed and sized
 * exactly like the toolbar search inputs. Only on WIDE screens (xl+, where it sits
 * inline with real room) do the chips stay on a single clipped line
 * (`xl:h-[38px] xl:overflow-hidden`); a ResizeObserver measures how many actually
 * fit so the caret's overflow popover lists ONLY the hidden ones — never a chip
 * already visible on the line. "All" and the active category are pinned, so the
 * current filter is always in view. Below xl (narrow desktop → mobile) the inline
 * line would crush to an unusable sliver, so the box goes full-width and wraps the
 * chips to the height it needs instead (COS-118).
 */
const SpendingCategoryFilter = ({ categories, total, selected, onSelect }: SpendingCategoryFilterProps) => {
  const spendings = useTranslations("spendings");
  const [open, setOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(categories.length);

  // Chips that compete for the clipped line — the active one is pinned separately,
  // so it can never fall into the hidden overflow.
  const selectedCategory = selected === null ? undefined : categories.find((c) => c.key === selected);
  const lineCategories = selected === null ? categories : categories.filter((c) => c.key !== selected);
  const lineSignature = lineCategories.map((c) => c.key).join(",");

  // Measure, on mount and whenever the row resizes, how many chips fit fully on
  // the single desktop line. The caret reserves its own width permanently (it only
  // toggles visibility), so the fit never oscillates as the caret appears.
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const measure = () => {
      const rowRight = row.getBoundingClientRect().right;
      // The row's only children are the category chips themselves.
      let count = 0;
      for (const chip of Array.from(row.children)) {
        if (chip.getBoundingClientRect().right > rowRight + 0.5) break;
        count++;
      }
      setVisibleCount(count);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [lineSignature]);

  if (categories.length === 0) {
    return null;
  }

  const hiddenCategories = lineCategories.slice(visibleCount);
  const hiddenCount = hiddenCategories.length;

  const pick = (key: string | null) => onSelect(key);
  const pickAndClose = (key: string | null) => {
    onSelect(key);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      {/* The whole boxed line is the positioning anchor, so the overlay opens at
          exactly its (responsive) width, reading as the continuation of the line. */}
      <PopoverAnchor asChild>
        <div className="flex w-full items-start gap-2 rounded-md border border-line bg-surface-elev px-2.5 py-2 xl:h-[38px] xl:items-center xl:overflow-hidden xl:py-0">
          <Overline className="shrink-0 pt-1 xl:pt-0">{spendings.filter.label}</Overline>
          <Chip
            active={selected === null}
            onClick={() => pick(null)}
            label={spendings.filter.all}
            count={total}
          />
          {selectedCategory && (
            <Chip
              active
              onClick={() => pick(null)}
              color={selectedCategory.color}
              label={selectedCategory.name}
              count={selectedCategory.count}
            />
          )}
          {/* Below xl: chips wrap to the height they need. xl+: one clipped line —
              overflow chips go invisible and live in the caret popover. */}
          <div
            ref={rowRef}
            className="flex min-w-0 flex-1 flex-wrap items-center gap-2 xl:flex-nowrap xl:overflow-hidden"
          >
            {lineCategories.map((c, i) => (
              <Chip
                key={c.key}
                className={cn(i >= visibleCount && "xl:invisible")}
                active={selected === c.key}
                onClick={() => pick(selected === c.key ? null : c.key)}
                color={c.color}
                label={c.name}
                count={c.count}
              />
            ))}
          </div>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={hiddenCount === 0}
              aria-label={spendings.filter.showAllAria}
              className={cn(
                "hidden shrink-0 items-center self-stretch border-l border-line pl-2 text-ink-4 transition-colors hover:text-ink xl:flex",
                hiddenCount === 0 && "xl:invisible",
              )}
            >
              <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) rounded-lg border border-line bg-surface-elev p-2 shadow-popover"
      >
        <div className="flex max-h-[60vh] flex-wrap gap-2 overflow-y-auto">
          {hiddenCategories.map((c) => (
            <Chip
              key={c.key}
              active={selected === c.key}
              onClick={() => pickAndClose(selected === c.key ? null : c.key)}
              color={c.color}
              label={c.name}
              count={c.count}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SpendingCategoryFilter;
