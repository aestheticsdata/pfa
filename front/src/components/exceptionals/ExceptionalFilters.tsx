"use client";

import { Overline } from "@components/shared/Overline";
import { Button } from "@components/ui/button";
import { cn } from "@lib/utils";
import { Plus } from "lucide-react";

interface CategoryChip {
  name: string;
  color: string;
}

interface ExceptionalFiltersProps {
  years: number[];
  selectedYear: number | null;
  onSelectYear: (year: number | null) => void;
  categories: CategoryChip[];
  activeCategory: string | null;
  onSelectCategory: (name: string | null) => void;
  onAdd: () => void;
}

const YearChip = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "inline-flex items-center rounded-full border px-3 py-1 text-xs transition-colors",
      active
        ? "border-exc/60 bg-exc/10 text-exc"
        : "border-line bg-surface-hi text-ink-2 hover:bg-surface-hover hover:text-ink",
    )}
  >
    {label}
  </button>
);

const ExceptionalFilters = ({
  years,
  selectedYear,
  onSelectYear,
  categories,
  activeCategory,
  onSelectCategory,
  onAdd,
}: ExceptionalFiltersProps) => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="mr-1 text-xs text-ink-3">Filtre :</span>
      {years.map((y) => (
        <YearChip
          key={y}
          active={selectedYear === y}
          label={String(y)}
          onClick={() => onSelectYear(y)}
        />
      ))}
      <YearChip
        active={selectedYear === null}
        label="Toutes les années"
        onClick={() => onSelectYear(null)}
      />
      <span className="grow" />
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={onAdd}
      >
        <Plus className="size-3.5" />
        Ajouter
      </Button>
    </div>

    {categories.length > 0 && (
      <div className="flex flex-wrap items-center gap-2">
        <Overline className="mr-1">Catégorie</Overline>
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs transition-colors",
            activeCategory === null
              ? "border-exc/60 bg-exc/10 text-exc"
              : "border-line bg-surface-hi text-ink-2 hover:bg-surface-hover hover:text-ink",
          )}
        >
          Toutes
        </button>
        {categories.map((cat) => {
          const active = activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelectCategory(active ? null : cat.name)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs capitalize transition-colors",
                active ? "text-ink" : "border-line bg-surface-hi text-ink-2 hover:bg-surface-hover hover:text-ink",
              )}
              style={
                active
                  ? {
                      borderColor: cat.color,
                      backgroundColor: `${cat.color}1f`,
                      color: cat.color,
                    }
                  : undefined
              }
            >
              <span
                className="size-[7px] shrink-0 rounded-[2px]"
                style={{ backgroundColor: cat.color }}
              />
              {cat.name}
            </button>
          );
        })}
      </div>
    )}
  </div>
);

export default ExceptionalFilters;
