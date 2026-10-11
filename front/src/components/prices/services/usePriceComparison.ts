import useRequestHelper from "@helpers/useRequestHelper";
import { QUERY_KEYS } from "@lib/query/keys";
import { parseResponse } from "@src/schemas/parseResponse";
import { PriceComparisonSchema } from "@src/schemas/prices";
import { useQuery } from "@tanstack/react-query";

/** One product type's stores, ranked per kilo / litre / piece (PFA-220). */
const usePriceComparison = (typeID: string | null) => {
  const { privateRequest } = useRequestHelper();

  return useQuery({
    queryKey: [QUERY_KEYS.PRICES, typeID],
    queryFn: async () => {
      const response = await privateRequest(`/prices/${typeID}`);
      return parseResponse(PriceComparisonSchema, response.data, "/prices/:typeID");
    },
    enabled: typeID !== null,
  });
};

export default usePriceComparison;
