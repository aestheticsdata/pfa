"use client";

import { FilterChip } from "@components/shared/FilterChip";
import { Overline } from "@components/shared/Overline";
import { Button } from "@components/ui/button";
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
  <FilterChip
    active={active}
    onClick={onClick}
    accent="exc"
    className="rounded-full px-3"
  >
    {label}
  </FilterChip>
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
        <FilterChip
          active={activeCategory === null}
          onClick={() => onSelectCategory(null)}
          accent="exc"
          className="rounded-full px-2.5"
        >
          Toutes
        </FilterChip>
        {categories.map((cat) => {
          const active = activeCategory === cat.name;
          return (
            <FilterChip
              key={cat.name}
              active={active}
              accentColor={cat.color}
              onClick={() => onSelectCategory(active ? null : cat.name)}
              className="gap-1.5 rounded-full px-2.5 capitalize"
            >
              <span
                className="size-[7px] shrink-0 rounded-[2px]"
                style={{ backgroundColor: cat.color }}
              />
              {cat.name}
            </FilterChip>
          );
        })}
      </div>
    )}
  </div>
);

export default ExceptionalFilters;
