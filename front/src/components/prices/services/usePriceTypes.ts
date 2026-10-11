import useRequestHelper from "@helpers/useRequestHelper";
import { QUERY_KEYS } from "@lib/query/keys";
import { parseResponse } from "@src/schemas/parseResponse";
import { ProductTypeSummaryListSchema } from "@src/schemas/prices";
import { useQuery } from "@tanstack/react-query";

/** The product types with prices to compare, most compared first (PFA-220). */
const usePriceTypes = () => {
  const { privateRequest } = useRequestHelper();

  return useQuery({
    queryKey: [QUERY_KEYS.PRICES],
    queryFn: async () => {
      const response = await privateRequest("/prices");
      return parseResponse(ProductTypeSummaryListSchema, response.data, "/prices");
    },
  });
};

export default usePriceTypes;
