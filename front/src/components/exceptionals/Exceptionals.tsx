"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import useGlobalStore from "@components/shared/globalStore";
import useExceptionals from "@components/exceptionals/services/useExceptionals";
import useRegularMonthlyAverage from "@components/exceptionals/services/useRegularMonthlyAverage";
import ExceptionalStatsCards from "@components/exceptionals/ExceptionalStatsCards";
import ExceptionalFilters from "@components/exceptionals/ExceptionalFilters";
import ExceptionalsList from "@components/exceptionals/ExceptionalsList";
import ExceptionalModal from "@components/exceptionals/ExceptionalModal";
import Spinner from "@components/common/Spinner";
import { Button } from "@components/ui/button";

import type { ExceptionalItem } from "@src/schemas/exceptionals";

const Exceptionals = () => {
  const { setIsCalendarVisible } = useGlobalStore();
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExceptionalItem | null>(null);

  const { exceptionals, isLoading, error, years } = useExceptionals({ year: selectedYear });
  const { data: monthlyAverageData } = useRegularMonthlyAverage(selectedYear);

  useEffect(() => {
    setIsCalendarVisible(false);
  }, [setIsCalendarVisible]);

  const availableCategories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of exceptionals) {
      if (item.categoryName && !seen.has(item.categoryName)) {
        seen.set(item.categoryName, item.categoryColor ?? "#94a3b8");
      }
    }
    return Array.from(seen.entries()).map(([name, color]) => ({ name, color }));
  }, [exceptionals]);

  const filteredItems = useMemo(() => {
    if (!activeCategory) return exceptionals;
    return exceptionals.filter((item) => item.categoryName === activeCategory);
  }, [exceptionals, activeCategory]);

  const yearsList = useMemo(() => {
    const set = new Set<number>(years);
    set.add(selectedYear);
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [years, selectedYear]);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (item: ExceptionalItem) => {
    setEditing(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  if (error) {
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <ExceptionalStatsCards items={exceptionals} year={selectedYear} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ExceptionalFilters
          years={yearsList}
          selectedYear={selectedYear}
          onSelectYear={setSelectedYear}
          categories={availableCategories}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />
        <Button variant="cyan" size="default" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          Ajouter
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <ExceptionalsList
          items={filteredItems}
          onEdit={handleEdit}
          monthlyAverage={monthlyAverageData?.monthlyAverage ?? 0}
        />
      )}

      {modalOpen && (
        <ExceptionalModal
          closeModal={closeModal}
          item={editing}
          existingCategories={availableCategories}
        />
      )}
    </div>
  );
};

export default Exceptionals;
