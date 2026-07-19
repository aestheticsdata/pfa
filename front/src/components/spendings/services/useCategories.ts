import { useAuth } from "@auth/context/AuthContext";
import { QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import useRequestHelper from "@helpers/useRequestHelper";
import { CategoryListSchema, UpdateCategoryPayloadSchema } from "@src/schemas/categories";
import { useMutation, useQuery, useQueryClient } from "react-query";

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
    await queryClient.invalidateQueries([QUERY_KEYS.CATEGORIES]);
    await queryClient.invalidateQueries([QUERY_KEYS.CATEGORY_STATS]);
    await queryClient.invalidateQueries([QUERY_KEYS.SPENDINGS_BY_MONTH]);
    await queryClient.invalidateQueries([QUERY_KEYS.CATEGORY_TRENDS]);
  };

  const getCategoriesService = async () => {
    try {
      const response = await privateRequest(`/categories?userID=${userID}`);
      return CategoryListSchema.parse(response.data);
    } catch (e) {
      console.log("get categories error : ", e);
      throw e; // Re-throw pour que React Query gère l'erreur correctement
    }
  };
  const { data: categories, error } = useQuery(QUERY_KEYS.CATEGORIES, getCategoriesService, {
    retry: 2, // Retry 2 fois en cas d'erreur
    enabled: !!userID,
    ...QUERY_OPTIONS,
  });

  const updateCategoryService = async (category: UpdateCategoryPayload) => {
    try {
      const payload = UpdateCategoryPayloadSchema.parse(category);
      return privateRequest(`/categories/${payload.ID}`, {
        method: "PUT",
        data: payload,
      });
    } catch (e) {
      console.log(e);
    }
  };
  const updateCategory = useMutation<unknown, AxiosError, UpdateCategoryVariables>(
    ({ singleCategory: category }) => {
      return updateCategoryService(category);
    },
    {
      onSuccess: async () => {
        await invalidation();
      },
      onError: (e) => {
        console.log("error updating category", e);
      },
    },
  );

  const deleteCategoryService = async (categoryID: string) => {
    return privateRequest(`/categories/${categoryID}`, {
      method: "DELETE",
    });
  };
  const deleteCategory = useMutation<unknown, unknown, DeleteCategoryVariables>(
    ({ categoryID }) => {
      return deleteCategoryService(categoryID);
    },
    {
      onSuccess: async () => {
        await invalidation();
      },
      onError: (e) => {
        console.log("error deleting category", e);
      },
    },
  );

  return {
    categories,
    error,
    deleteCategory,
    updateCategory,
  };
};

export default useCategories;
