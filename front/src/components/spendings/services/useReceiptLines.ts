import { receiptLinesQuery, receiptOcrQuery } from "@components/spendings/services/queries";
import useRequestHelper from "@helpers/useRequestHelper";
import useTranslations from "@i18n/useTranslations";
import { invalidateFamilies } from "@lib/query/invalidate";
import { QUERY_KEYS } from "@lib/query/keys";
import { parseResponse } from "@src/schemas/parseResponse";
import { ReceiptLinesResponseSchema, SaveReceiptLinesPayloadSchema } from "@src/schemas/receiptLines";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { SavedReceipt } from "@src/schemas/receiptLines";

interface ReceiptLinesQueries {
  /** Load the lines already saved for the spending. */
  withSaved: boolean;
  /** Run the OCR on the spending's receipt for a fresh proposal. */
  withProposal: boolean;
}

/**
 * A spending's receipt lines and store (PFA-214, PFA-218): the saved set, the
 * OCR proposal, and saving what the user accepted.
 */
const useReceiptLines = (spendingID: string, queries: ReceiptLinesQueries) => {
  const { receiptLines: t } = useTranslations("spendings");
  const { privateRequest } = useRequestHelper();
  const queryClient = useQueryClient();
  const endpoint = `/spendings/${spendingID}/lines`;

  const saved = useQuery({ ...receiptLinesQuery(privateRequest, spendingID), enabled: queries.withSaved });

  // A POST, but read like a query: one OCR run per opening, never cached
  // past it, never retried behind the user's back.
  const proposal = useQuery({ ...receiptOcrQuery(privateRequest, spendingID), enabled: queries.withProposal });

  const save = useMutation({
    mutationFn: async (receipt: SavedReceipt) => {
      const payload = SaveReceiptLinesPayloadSchema.parse(receipt);
      const response = await privateRequest(endpoint, { method: "PUT", data: payload });
      return parseResponse(ReceiptLinesResponseSchema, response.data, endpoint);
    },
    onSuccess: async (receipt) => {
      toast.success(t.saved);
      queryClient.setQueryData(receiptLinesQuery(privateRequest, spendingID).queryKey, receipt);
      await invalidateFamilies(queryClient, [
        // A store or a type typed for the first time joins its list (PFA-218, PFA-219).
        QUERY_KEYS.STORES,
        QUERY_KEYS.PRODUCT_TYPES,
        // New lines change the price comparison (PFA-220).
        QUERY_KEYS.PRICES,
        // A saved receipt leaves the bulk-read queue (PFA-223).
        QUERY_KEYS.RECEIPT_PROPOSALS,
        // The rows' line mark and store come with the spendings.
        QUERY_KEYS.SPENDINGS_BY_MONTH,
        QUERY_KEYS.SPENDINGS_SEARCH,
      ]);
    },
    onError: () => toast.error(t.saveFailed),
  });

  return { saved, proposal, save };
};

export default useReceiptLines;
