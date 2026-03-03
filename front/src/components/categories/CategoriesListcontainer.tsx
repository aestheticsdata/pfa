import useCategories from "@components/spendings/services/useCategories";
import CategoryItem from "@components/categories/CategoryItem";
import Spinner from "@components/common/Spinner";

import type { Category } from "@src/schemas/categories";

const CategoriesListcontainer = () => {
  const { categories, error } = useCategories();

  if (error) {
    throw error;
  }

  return (
    <div className="flex flex-col md:mt-20 pl-1 space-y-2">
      <div className="ml-1 font-ubuntu text-grey3 font-bold underline">
        Nombre de catégories : {categories?.length || 0}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {categories && categories.length > 0 ?
        categories
          .sort((c1: Category, c2: Category) => c1.name.localeCompare(c2.name))
          .map((category: Category) => (
            <CategoryItem
              key={category.ID}
              category={category}
            />
          )
        )
        :
        <div>
          <Spinner />
        </div>
      }
      </div>
    </div>
  )
}

export default CategoriesListcontainer;
