import useRequestHelper from "@helpers/useRequestHelper";
import { QUERY_KEYS } from "@lib/query/keys";
import { parseResponse } from "@src/schemas/parseResponse";
import { StoreListSchema } from "@src/schemas/receiptLines";
import { useQuery } from "@tanstack/react-query";

/** The user's stores, offered by the store field of the receipt lines (PFA-218). */
const useStores = () => {
  const { privateRequest } = useRequestHelper();

  return useQuery({
    queryKey: [QUERY_KEYS.STORES],
    queryFn: async () => {
      const response = await privateRequest("/stores");
      return parseResponse(StoreListSchema, response.data, "/stores");
    },
  });
};

export default useStores;
