import { receiptImageQuery } from "@components/spendings/services/queries";
import useRequestHelper from "@helpers/useRequestHelper";
import { useQuery } from "@tanstack/react-query";

// The receipt comes back as a data URL, or null when the spending has none.
/** A spending's receipt image, for the thumbnail beside its lines (PFA-214). */
const useReceiptImage = (spendingID: string) => {
  const { privateRequest } = useRequestHelper();

  return useQuery(receiptImageQuery(privateRequest, spendingID));
};

export default useReceiptImage;
