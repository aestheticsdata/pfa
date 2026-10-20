import { priceTypesQuery } from "@components/prices/services/queries";
import useRequestHelper from "@helpers/useRequestHelper";
import { useQuery } from "@tanstack/react-query";

/** The product types with prices to compare, most compared first (PFA-220). */
const usePriceTypes = () => {
  const { privateRequest } = useRequestHelper();

  return useQuery(priceTypesQuery(privateRequest));
};

export default usePriceTypes;
