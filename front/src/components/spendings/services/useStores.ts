import { storesQuery } from "@components/spendings/services/queries";
import useRequestHelper from "@helpers/useRequestHelper";
import { useQuery } from "@tanstack/react-query";

/** The user's stores, offered by the store field of the receipt lines (PFA-218). */
const useStores = () => {
  const { privateRequest } = useRequestHelper();

  return useQuery(storesQuery(privateRequest));
};

export default useStores;
