import useRequestHelper from "@helpers/useRequestHelper";
import { QUERY_KEYS } from "@lib/query/keys";
import { parseResponse } from "@src/schemas/parseResponse";
import { ProductTypeListSchema } from "@src/schemas/receiptLines";
import { useQuery } from "@tanstack/react-query";

/** The user's generic products, offered by each receipt line's type field (PFA-219). */
const useProductTypes = () => {
  const { privateRequest } = useRequestHelper();

  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCT_TYPES],
    queryFn: async () => {
      const response = await privateRequest("/product-types");
      return parseResponse(ProductTypeListSchema, response.data, "/product-types");
    },
  });
};

export default useProductTypes;
