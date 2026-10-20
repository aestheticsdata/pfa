import { regularMonthlyAverageQuery } from "@components/exceptionals/services/queries";
import useRequestHelper from "@helpers/useRequestHelper";
import { useQuery } from "@tanstack/react-query";

const useRegularMonthlyAverage = (year: number) => {
  const { privateRequest } = useRequestHelper();

  return useQuery(regularMonthlyAverageQuery(privateRequest, year));
};

export default useRegularMonthlyAverage;
