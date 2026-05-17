"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { cn } from "@lib/utils";

interface CategoryChip {
  name: string;
  color: string;
}

interface ExceptionalFiltersProps {
  years: number[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
  categories: CategoryChip[];
  activeCategory: string | null;
  onSelectCategory: (name: string | null) => void;
}

const ExceptionalFilters = ({
  years,
  selectedYear,
  onSelectYear,
  categories,
  activeCategory,
  onSelectCategory,
}: ExceptionalFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-gray-400 text-sm">Filtre :</span>
      <Select
        value={String(selectedYear)}
        onValueChange={(v) => onSelectYear(Number(v))}
      >
        <SelectTrigger className="bg-[#0c0c0c] border-gray-700/50 text-gray-200 hover:bg-[#151515] min-w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#0c0c0c] border-gray-700/50 text-gray-200">
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={cn(
          "px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
          activeCategory === null
            ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
            : "bg-[#0c0c0c] border border-gray-700/50 text-gray-300 hover:bg-[#151515]",
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
              "px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer inline-flex items-center gap-2",
              active
                ? "text-white shadow-lg"
                : "bg-[#0c0c0c] border border-gray-700/50 text-gray-300 hover:bg-[#151515]",
            )}
            style={
              active
                ? { backgroundColor: cat.color, boxShadow: `0 10px 25px -10px ${cat.color}` }
                : undefined
            }
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: cat.color }}
            />
            {cat.name}
          </button>
        );
      })}
    </div>
  );
};

export default ExceptionalFilters;
