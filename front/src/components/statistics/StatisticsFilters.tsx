"use client";

import ExportButton from "@components/shared/ExportButton";
import { Input } from "@components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Switch } from "@components/ui/switch";
import { cn } from "@lib/utils";
import { Calendar, Check, ChevronDown, Plus, Search, X } from "lucide-react";
import { useState } from "react";

import type { Category } from "@src/schemas/categories";

interface StatisticsFiltersProps {
  years: number[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
  compareEnabled: boolean;
  onToggleCompare: (value: boolean) => void;
  compareYear: number;
  onSelectCompareYear: (year: number) => void;
  showExceptionals: boolean;
  onToggleExceptionals: (value: boolean) => void;
  categories: Category[];
  selectedCategoryIds: string[];
  onToggleCategory: (id: string) => void;
  maxCategories: number;
}

const popContent = "rounded-[10px] border border-line bg-surface-elev p-1.5 shadow-popover";

const YearMenu = ({
  years,
  selected,
  exclude,
  onSelect,
  children,
  align = "start",
}: {
  years: number[];
  selected: number;
  exclude?: number;
  onSelect: (year: number) => void;
  children: React.ReactNode;
  align?: "start" | "end";
}) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn(popContent, "w-[132px]")}
      >
        <div className="flex max-h-[264px] flex-col overflow-y-auto">
          {years
            .filter((year) => year !== exclude)
            .map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => {
                  onSelect(year);
                  setOpen(false);
                }}
                className={cn(
                  "num flex items-center justify-between rounded-md px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-surface-hi",
                  year === selected ? "text-accent-strong" : "text-ink-2",
                )}
              >
                {year}
                {year === selected && <Check className="size-3.5" />}
              </button>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

/** Statistiques filter bar — year, compare-year, exceptionals toggle, category
 *  picker (max N) and a mock export, per the Statistiques 2026 mockup. */
const StatisticsFilters = ({
  years,
  selectedYear,
  onSelectYear,
  compareEnabled,
  onToggleCompare,
  compareYear,
  onSelectCompareYear,
  showExceptionals,
  onToggleExceptionals,
  categories,
  selectedCategoryIds,
  onToggleCategory,
  maxCategories,
}: StatisticsFiltersProps) => {
  const [catOpen, setCatOpen] = useState(false);
  const [query, setQuery] = useState("");

  const atMax = selectedCategoryIds.length >= maxCategories;
  const selectedCategories = selectedCategoryIds
    .map((id) => categories.find((c) => c.ID === id))
    .filter((c): c is Category => Boolean(c));

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <section className="flex flex-wrap items-center gap-2.5">
      {/* Year */}
      <YearMenu
        years={years}
        selected={selectedYear}
        onSelect={onSelectYear}
      >
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-[6px] border border-line bg-surface-elev px-2.5 py-[7px] text-[13px] text-ink-2 transition-colors hover:border-ink-4"
        >
          <Calendar className="size-3.5 text-ink-4" />
          <span className="num text-ink">{selectedYear}</span>
          <ChevronDown className="size-3 text-ink-4" />
        </button>
      </YearMenu>

      {/* Compare */}
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-[6px] border border-line px-2.5 py-[6px] text-[12px]",
          compareEnabled ? "bg-surface-elev" : "bg-transparent",
        )}
      >
        <Switch
          checked={compareEnabled}
          onCheckedChange={onToggleCompare}
          className="data-[state=checked]:bg-accent-strong"
        />
        <span className="text-ink-3">Comparer à</span>
        <YearMenu
          years={years}
          selected={compareYear}
          exclude={selectedYear}
          onSelect={onSelectCompareYear}
          align="end"
        >
          <button
            type="button"
            disabled={!compareEnabled}
            className="inline-flex items-center gap-1 rounded-[6px] border border-line bg-surface-hi px-1.5 py-0.5 text-[12px] text-ink-2 transition-colors hover:border-ink-4 disabled:opacity-40"
          >
            <span className="num">{compareYear}</span>
            <ChevronDown className="size-2.5 text-ink-4" />
          </button>
        </YearMenu>
      </div>

      {/* Exceptionals */}
      <label
        htmlFor="stat-exceptionals"
        className="inline-flex cursor-pointer items-center gap-2 rounded-[6px] border border-line px-2.5 py-[6px] text-[12px] text-ink-2"
      >
        <Switch
          id="stat-exceptionals"
          checked={showExceptionals}
          onCheckedChange={onToggleExceptionals}
          className="data-[state=checked]:bg-exc"
        />
        Achats exceptionnels
      </label>

      {/* Category picker */}
      <Popover
        open={catOpen}
        onOpenChange={setCatOpen}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={atMax}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[6px] border border-line bg-surface-elev py-[7px] pl-2.5 pr-3 text-[13px] text-ink-2 transition-colors hover:border-ink-4",
              atMax && "pointer-events-none opacity-45",
            )}
          >
            <Plus className="size-3" />
            Ajouter une catégorie
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn(popContent, "w-72")}
        >
          <div className="relative mb-1.5">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-4" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher…"
              className="h-9 border-line bg-background pl-8 text-[13px]"
            />
          </div>
          <div className="max-h-[264px] overflow-y-auto pr-0.5">
            {filtered.length === 0 ? (
              <div className="px-2.5 py-3 text-center text-[12.5px] text-ink-4">Aucune catégorie</div>
            ) : (
              filtered.map((category) => {
                const active = selectedCategoryIds.includes(category.ID);
                return (
                  <button
                    key={category.ID}
                    type="button"
                    onClick={() => onToggleCategory(category.ID)}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] capitalize text-ink-2 transition-colors hover:bg-surface-hi hover:text-ink"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: category.color }}
                    />
                    <span className="flex-1 truncate">{category.name}</span>
                    {active && <Check className="size-3.5 text-accent-strong" />}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected chips */}
      {selectedCategories.map((category) => (
        <span
          key={category.ID}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-hi py-[5px] pl-2 pr-1.5 text-[12.5px] capitalize text-ink-2"
        >
          <span
            className="size-2 rounded-full"
            style={{ background: category.color }}
          />
          {category.name}
          <button
            type="button"
            onClick={() => onToggleCategory(category.ID)}
            aria-label={`Retirer ${category.name}`}
            className="grid size-[17px] place-items-center rounded-[5px] text-ink-4 transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      {/* Export (MOCK) — shared with every page */}
      <ExportButton className="ml-auto" />
    </section>
  );
};

export default StatisticsFilters;
