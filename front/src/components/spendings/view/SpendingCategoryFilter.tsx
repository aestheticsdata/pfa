"use client";

import { FilterChip } from "@components/shared/FilterChip";
import { Overline } from "@components/shared/Overline";
import { cn } from "@lib/utils";

export interface FilterCategory {
  key: string;
  name: string;
  color: string;
  count: number;
}

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
}: {
  active: boolean;
  onClick: () => void;
  color?: string;
  label: string;
  count: number;
}) => (
  <FilterChip
    active={active}
    onClick={onClick}
    className="gap-1.5 rounded-lg px-2.5 capitalize"
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
 * Global category filter strip for the Dépenses timeline. Selecting a chip
 * filters every day card to that category (null = all).
 */
const SpendingCategoryFilter = ({ categories, total, selected, onSelect }: SpendingCategoryFilterProps) => {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Overline className="mr-1">Filtrer</Overline>
      <Chip
        active={selected === null}
        onClick={() => onSelect(null)}
        label="Toutes"
        count={total}
      />
      {categories.map((c) => (
        <Chip
          key={c.key}
          active={selected === c.key}
          onClick={() => onSelect(selected === c.key ? null : c.key)}
          color={c.color}
          label={c.name}
          count={c.count}
        />
      ))}
    </div>
  );
};

export default SpendingCategoryFilter;
