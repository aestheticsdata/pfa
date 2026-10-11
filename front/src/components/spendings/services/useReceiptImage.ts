import useRequestHelper from "@helpers/useRequestHelper";
import { QUERY_KEYS } from "@lib/query/keys";
import { itemTypeSchema } from "@src/schemas/primitives";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

// The receipt comes back as a data URL, or null when the spending has none.
const ReceiptImageSchema = z.string().nullable();

/** A spending's receipt image, for the thumbnail beside its lines (PFA-214). */
const useReceiptImage = (spendingID: string) => {
  const { privateRequest } = useRequestHelper();

  return useQuery({
    queryKey: [QUERY_KEYS.RECEIPT_IMAGE, spendingID],
    queryFn: async () => {
      const response = await privateRequest(`/spendings/upload/${spendingID}?itemType=${itemTypeSchema.enum.spending}`);
      const parsed = ReceiptImageSchema.safeParse(response.data);
      return parsed.success ? parsed.data : null;
    },
    gcTime: 0,
  });
};

export default useReceiptImage;
