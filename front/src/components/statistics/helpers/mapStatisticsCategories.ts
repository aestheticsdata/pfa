import type { Category } from "@src/schemas/categories";

export interface StatisticsCategoryOption extends Category {
  label: string;
  value: string;
}

const mapStatisticsCategories = (categories: Category[] | undefined) => {
  if (!categories) return [];

  const categoriesTmp = categories.map((category) => ({
    ...category,
    label: category.name,
    value: category.ID,
  }));

  categoriesTmp.sort((a, b) => a.label.localeCompare(b.label));
  return categoriesTmp;
};

export default mapStatisticsCategories;
