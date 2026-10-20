import { categoriesQuery } from "@components/spendings/services/queries";
import useRequestHelper from "@helpers/useRequestHelper";
import { invalidateFamilies } from "@lib/query/invalidate";
import { QUERY_KEYS } from "@lib/query/keys";
import { UpdateCategoryPayloadSchema } from "@src/schemas/categories";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "@helpers/http";
import type { UpdateCategoryPayload } from "@src/schemas/categories";

const useCategories = () => {
  const { privateRequest } = useRequestHelper();
  const queryClient = useQueryClient();
  type UpdateCategoryVariables = { singleCategory: UpdateCategoryPayload };
  type DeleteCategoryVariables = { categoryID: string };

  const invalidation = async () => {
    await invalidateFamilies(queryClient, [
      QUERY_KEYS.CATEGORIES,
      QUERY_KEYS.CATEGORY_STATS,
      QUERY_KEYS.SPENDINGS_BY_MONTH,
      QUERY_KEYS.CATEGORY_TRENDS,
    ]);
  };

  const { data: categories } = useQuery(categoriesQuery(privateRequest));

  const updateCategoryService = async (category: UpdateCategoryPayload) => {
    const payload = UpdateCategoryPayloadSchema.parse(category);
    return privateRequest(`/categories/${payload.ID}`, {
      method: "PUT",
      data: payload,
    });
  };
  const updateCategory = useMutation<unknown, ApiError, UpdateCategoryVariables>({
    mutationFn: ({ singleCategory: category }) => {
      return updateCategoryService(category);
    },

    onSuccess: async () => {
      await invalidation();
    },
  });

  const deleteCategoryService = async (categoryID: string) => {
    return privateRequest(`/categories/${categoryID}`, {
      method: "DELETE",
    });
  };
  const deleteCategory = useMutation<unknown, unknown, DeleteCategoryVariables>({
    mutationFn: ({ categoryID }) => {
      return deleteCategoryService(categoryID);
    },

    onSuccess: async () => {
      await invalidation();
    },
  });

  return {
    categories,
    deleteCategory,
    updateCategory,
  };
};

export default useCategories;
