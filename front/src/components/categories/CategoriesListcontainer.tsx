"use client";

import useCategories from "@components/spendings/services/useCategories";
import CategoryItem from "@components/categories/CategoryItem";
import Spinner from "@components/common/Spinner";
import { SurfaceCard } from "@components/ui/surface-card";

import type { Category } from "@src/schemas/categories";

const CategoriesListcontainer = () => {
  const { categories, error } = useCategories();

  if (error) {
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <SurfaceCard className="flex items-center justify-between flex-wrap gap-4 p-6">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl px-6 py-4 shadow-lg shadow-cyan-500/10">
            <div className="text-white/80 text-xs uppercase tracking-wider">
              Total des catégories
            </div>
            <div className="text-white text-2xl font-bold tabular-nums">
              {categories?.length ?? 0}
            </div>
          </div>
          <p className="text-gray-400 text-sm hidden sm:block">
            Gérez vos catégories de dépenses
          </p>
        </div>
      </SurfaceCard>

      {!categories || categories.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...categories]
            .sort((c1: Category, c2: Category) =>
              c1.name.localeCompare(c2.name),
            )
            .map((category: Category) => (
              <CategoryItem key={category.ID} category={category} />
            ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesListcontainer;
