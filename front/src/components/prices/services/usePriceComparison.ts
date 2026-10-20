import { priceComparisonQuery } from "@components/prices/services/queries";
import useRequestHelper from "@helpers/useRequestHelper";
import { useQuery } from "@tanstack/react-query";

/** One product type's stores, ranked per kilo / litre / piece (PFA-220). */
const usePriceComparison = (typeID: string | null) => {
  const { privateRequest } = useRequestHelper();

  return useQuery(priceComparisonQuery(privateRequest, typeID));
};

export default usePriceComparison;
