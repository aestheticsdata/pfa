import { useEffect, useState } from 'react';

import type { Category } from "@src/schemas/categories";

export interface StatisticsCategoryOption extends Category {
  label: string;
  value: string;
}

const useStatisticsCategories = (categories: Category[] | undefined) => {
  const [statisticsCategories, setStatisticsCategories] = useState<StatisticsCategoryOption[]>([]);

  useEffect(() => {
    if (categories) {
      const categoriesTmp = categories.map((category) => ({
        ...category,
        label: category.name,
        value: category.ID,
      }));

      categoriesTmp.sort((a, b) => a.label.localeCompare(b.label));

      setStatisticsCategories(categoriesTmp);
    }
  }, [categories]);

  return statisticsCategories;
};

export default useStatisticsCategories;
