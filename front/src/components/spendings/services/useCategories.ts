import { useAuth } from "@auth/context/AuthContext";
import useRequestHelper from "@helpers/useRequestHelper";
import { QUERY_KEYS } from "@lib/query/keys";
import { CategoryListSchema, UpdateCategoryPayloadSchema } from "@src/schemas/categories";
import { parseResponse } from "@src/schemas/parseResponse";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { UpdateCategoryPayload } from "@src/schemas/categories";
import type { AxiosError } from "axios";

const useCategories = () => {
  const { privateRequest } = useRequestHelper();
  const { user } = useAuth();
  const userID = user?.id;
  const queryClient = useQueryClient();
  type UpdateCategoryVariables = { singleCategory: UpdateCategoryPayload };
  type DeleteCategoryVariables = { categoryID: string };

  const invalidation = async () => {
    await queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.CATEGORIES],
    });
    await queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.CATEGORY_STATS],
    });
    await queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.SPENDINGS_BY_MONTH],
    });
    await queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.CATEGORY_TRENDS],
    });
  };

  const getCategoriesService = async () => {
    const response = await privateRequest(`/categories`);
    return parseResponse(CategoryListSchema, response.data, "/categories");
  };
  const { data: categories } = useQuery({
    queryKey: [QUERY_KEYS.CATEGORIES],
    queryFn: getCategoriesService,
    retry: 2, // Retry 2 fois en cas d'erreur
    enabled: !!userID,
  });

  const updateCategoryService = async (category: UpdateCategoryPayload) => {
    const payload = UpdateCategoryPayloadSchema.parse(category);
    return privateRequest(`/categories/${payload.ID}`, {
      method: "PUT",
      data: payload,
    });
  };
  const updateCategory = useMutation<unknown, AxiosError, UpdateCategoryVariables>({
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
