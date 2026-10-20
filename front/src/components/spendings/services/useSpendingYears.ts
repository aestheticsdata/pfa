import { spendingYearsQuery } from "@components/spendings/services/queries";
import useRequestHelper from "@helpers/useRequestHelper";
import { useQuery } from "@tanstack/react-query";

/**
 * Years the user has spendings in (newest first), backing the search modal's year
 * filter (COS-114). Independent of the search term so the chips stay stable while
 * filtering.
 */
const useSpendingYears = () => {
  const { privateRequest } = useRequestHelper();

  const { data } = useQuery(spendingYearsQuery(privateRequest));

  return data ?? [];
};

export default useSpendingYears;
