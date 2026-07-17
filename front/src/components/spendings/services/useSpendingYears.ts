import { useAuth } from "@auth/context/AuthContext";
import { QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import useRequestHelper from "@helpers/useRequestHelper";
import { SpendingYearsSchema } from "@src/schemas/spendings";
import { useQuery } from "react-query";

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
    return SpendingYearsSchema.parse(response.data);
  };

  const { data } = useQuery([QUERY_KEYS.SPENDINGS_YEARS], fetchYears, {
    enabled: !!userID,
    retry: false,
    ...QUERY_OPTIONS,
  });

  return data ?? [];
};

export default useSpendingYears;
