import { useAuth } from "@auth/context/AuthContext";
import useRequestHelper from "@helpers/useRequestHelper";
import { QUERY_KEYS } from "@lib/query/keys";
import { parseResponse } from "@src/schemas/parseResponse";
import { SpendingYearsSchema } from "@src/schemas/spendings";
import { useQuery } from "@tanstack/react-query";

/**
 * Years the user has spendings in (newest first), backing the search modal's year
 * filter (COS-114). Independent of the search term so the chips stay stable while
 * filtering.
 */
const useSpendingYears = () => {
  const { privateRequest } = useRequestHelper();
  const { user } = useAuth();
  const userID = user?.id;

  const fetchYears = async () => {
    const response = await privateRequest("/spendings/years");
    return parseResponse(SpendingYearsSchema, response.data, "/spendings/years");
  };

  const { data } = useQuery({
    queryKey: [QUERY_KEYS.SPENDINGS_YEARS],
    queryFn: fetchYears,
    enabled: !!userID,
    retry: false,
    // On failure the year chips simply don't render; the search modal surfaces
    // its own errors inline (opts out of the global throwOnError).
    throwOnError: false,
  });

  return data ?? [];
};

export default useSpendingYears;
