"use client";

import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import Spinner from "@components/common/Spinner";
import ExceptionalFilters from "@components/exceptionals/ExceptionalFilters";
import ExceptionalModal from "@components/exceptionals/ExceptionalModal";
import ExceptionalStatsCards from "@components/exceptionals/ExceptionalStatsCards";
import ExceptionalsList from "@components/exceptionals/ExceptionalsList";
import useExceptionals from "@components/exceptionals/services/useExceptionals";
import useRegularMonthlyAverage from "@components/exceptionals/services/useRegularMonthlyAverage";
import useGlobalStore from "@components/shared/globalStore";
import { useEffect, useState } from "react";

import type { ExceptionalItem } from "@src/schemas/exceptionals";

const Exceptionals = () => {
  const { setIsCalendarVisible } = useGlobalStore();
  // Computed once per instance (stable across re-renders).
  const [currentYear] = useState(() => new Date().getFullYear());
  // null = "All years" (backend fetches all when no year param)
  const [selectedYear, setSelectedYear] = useState<number | null>(currentYear);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExceptionalItem | null>(null);

  const { exceptionals, isLoading, years } = useExceptionals({
    year: selectedYear ?? undefined,
  });
  const { data: monthlyAverageData } = useRegularMonthlyAverage(selectedYear ?? currentYear);

  useEffect(() => {
    setIsCalendarVisible(false);
  }, [setIsCalendarVisible]);

  const seenCategories = new Map<string, string>();
  for (const item of exceptionals) {
    if (item.categoryName && !seenCategories.has(item.categoryName)) {
      seenCategories.set(item.categoryName, item.categoryColor ?? CATEGORY_FALLBACK);
    }
  }
  const availableCategories = Array.from(seenCategories.entries()).map(([name, color]) => ({ name, color }));

  const filteredItems = activeCategory
    ? exceptionals.filter((item) => item.categoryName === activeCategory)
    : exceptionals;

  const yearSet = new Set<number>(years);
  yearSet.add(currentYear);
  if (selectedYear != null) {
    yearSet.add(selectedYear);
  }
  const yearsList = Array.from(yearSet).sort((a, b) => b - a);

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

  return (
    <div className="flex flex-col gap-4">
      <ExceptionalStatsCards
        items={exceptionals}
        year={selectedYear}
        monthlyAverage={monthlyAverageData?.monthlyAverage ?? 0}
      />

      <ExceptionalFilters
        years={yearsList}
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        categories={availableCategories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onAdd={handleAdd}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
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
