import { productTypesQuery } from "@components/spendings/services/queries";
import useRequestHelper from "@helpers/useRequestHelper";
import { useQuery } from "@tanstack/react-query";

/** The user's generic products, offered by each receipt line's type field (PFA-219). */
const useProductTypes = () => {
  const { privateRequest } = useRequestHelper();

  return useQuery(productTypesQuery(privateRequest));
};

export default useProductTypes;
