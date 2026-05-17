"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import useCategories from "@components/spendings/services/useCategories";
import mapStatisticsCategories from "@components/statistics/helpers/mapStatisticsCategories";
import useStatistics from "@components/statistics/services/useStatistics";
import PFABarCharts from "@components/statistics/PFABarCharts";
import PFALineCharts from "@components/statistics/PFALineCharts";
import PFAResponsiveChartsContainer from "@components/statistics/PFAResponsiveChartsContainer";
import { SurfaceCard } from "@components/ui/surface-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@components/ui/command";
import { Skeleton } from "@components/ui/skeleton";
import type { StatisticsCategoryOption } from "@components/statistics/helpers/mapStatisticsCategories";

const firstYearAvailable = 2018;
const currentYear = new Date().getFullYear();

const yearsList = Array.from(
  { length: currentYear - firstYearAvailable + 1 },
  (_, i) => currentYear - i,
);

const Statistics = () => {
  const { categories, error: categoriesError } = useCategories();
  const categoriesMarshalled = mapStatisticsCategories(categories);
  const [selectedCategories, setSelectedCategories] = useState<
    StatisticsCategoryOption[]
  >([]);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const {
    isLoading: isStatisticsLoading,
    statistics,
    error,
  } = useStatistics(selectedCategories, {
    value: selectedYear,
    label: selectedYear,
  });

  if (categoriesError) {
    throw categoriesError;
  }

  if (error) {
    throw error;
  }

  const addCategory = (cat: StatisticsCategoryOption) => {
    setSelectedCategories((prev) =>
      prev.some((c) => c.ID === cat.ID) ? prev : [...prev, cat],
    );
    setComboboxOpen(false);
  };

  const removeCategory = (id: StatisticsCategoryOption["ID"]) => {
    setSelectedCategories((prev) => prev.filter((c) => c.ID !== id));
  };

  const availableCategories = categoriesMarshalled.filter(
    (cat) => !selectedCategories.some((c) => c.ID === cat.ID),
  );

  return (
    <div className="flex flex-col gap-6">
      <SurfaceCard className="flex flex-wrap gap-2 p-4 items-center">
        <Select
          value={String(selectedYear)}
          onValueChange={(v) => setSelectedYear(Number(v))}
        >
          <SelectTrigger className="w-[110px] bg-gray-700/70 dark:bg-gray-700/70 dark:hover:bg-gray-700/80 border-transparent text-gray-200 h-9 focus-visible:ring-0 focus-visible:border-gray-700/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 dark:bg-gray-800 border-gray-700/50 text-gray-200">
            {yearsList.map((y) => (
              <SelectItem
                key={y}
                value={String(y)}
                className="focus:bg-gray-700/70 focus:text-gray-100"
              >
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {availableCategories.length > 0 && (
          <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 h-9 px-3 bg-gray-700/50 rounded-md text-sm text-gray-300 hover:bg-gray-700/70 hover:cursor-pointer transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter une catégorie
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0 bg-gray-800 border-gray-700/50 w-[240px]"
              align="start"
            >
              <Command className="bg-transparent">
                <CommandInput
                  placeholder="Rechercher..."
                  className="text-gray-200"
                />
                <CommandList>
                  <CommandEmpty>Aucune catégorie.</CommandEmpty>
                  <CommandGroup>
                    {availableCategories.map((cat) => (
                      <CommandItem
                        key={cat.ID}
                        value={cat.name}
                        onSelect={() => addCategory(cat)}
                        className="data-[selected=true]:bg-gray-700/70 data-[selected=true]:text-gray-100"
                      >
                        <span
                          className="w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: cat.color ?? "#94a3b8" }}
                        />
                        <span className="flex-1">{cat.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {selectedCategories.map((cat) => (
          <span
            key={cat.ID}
            className="inline-flex items-center gap-2 h-9 pl-3 pr-2 bg-gray-700/70 rounded-md text-sm text-gray-200"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: cat.color ?? "#94a3b8" }}
            />
            <span>{cat.name}</span>
            <button
              type="button"
              onClick={() => removeCategory(cat.ID)}
              aria-label={`Retirer ${cat.name}`}
              className="text-gray-400 hover:text-gray-100 hover:cursor-pointer p-0.5 rounded focus:outline-none focus-visible:outline-none focus-visible:ring-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
      </SurfaceCard>

      <div className="flex flex-col lg:flex-row gap-6">
        <PFAResponsiveChartsContainer title="Dépenses mensuelles par catégorie">
          {isStatisticsLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <PFABarCharts data={statistics ?? null} year={selectedYear} />
          )}
        </PFAResponsiveChartsContainer>

        <PFAResponsiveChartsContainer title="Évolution des dépenses">
          {isStatisticsLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <PFALineCharts data={statistics ?? null} year={selectedYear} />
          )}
        </PFAResponsiveChartsContainer>
      </div>
    </div>
  );
};

export default Statistics;
