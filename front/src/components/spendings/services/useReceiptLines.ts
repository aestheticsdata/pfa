import useRequestHelper from "@helpers/useRequestHelper";
import useTranslations from "@i18n/useTranslations";
import { QUERY_KEYS } from "@lib/query/keys";
import { parseResponse } from "@src/schemas/parseResponse";
import {
  ReceiptLinesResponseSchema,
  ReceiptProposalSchema,
  SaveReceiptLinesPayloadSchema,
} from "@src/schemas/receiptLines";
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

  const saved = useQuery({
    queryKey: [QUERY_KEYS.RECEIPT_LINES, spendingID],
    queryFn: async () => {
      const response = await privateRequest(endpoint);
      return parseResponse(ReceiptLinesResponseSchema, response.data, endpoint);
    },
    enabled: queries.withSaved,
  });

  // A POST, but read like a query: one OCR run per opening, never cached
  // past it, never retried behind the user's back.
  const proposal = useQuery({
    queryKey: [QUERY_KEYS.RECEIPT_OCR, spendingID],
    queryFn: async () => {
      const response = await privateRequest(`${endpoint}/ocr`, { method: "POST" });
      return parseResponse(ReceiptProposalSchema, response.data, `${endpoint}/ocr`);
    },
    enabled: queries.withProposal,
    gcTime: 0,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const save = useMutation({
    mutationFn: async (receipt: SavedReceipt) => {
      const payload = SaveReceiptLinesPayloadSchema.parse(receipt);
      const response = await privateRequest(endpoint, { method: "PUT", data: payload });
      return parseResponse(ReceiptLinesResponseSchema, response.data, endpoint);
    },
    onSuccess: async (receipt) => {
      toast.success(t.saved);
      queryClient.setQueryData([QUERY_KEYS.RECEIPT_LINES, spendingID], receipt);
      // A store or a type typed for the first time joins its list (PFA-218, PFA-219).
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STORES] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCT_TYPES] });
      // New lines change the price comparison (PFA-220).
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRICES] });
      // A saved receipt leaves the bulk-read queue (PFA-223).
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECEIPT_PROPOSALS] });
      // The rows' line mark and store come with the spendings.
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SPENDINGS_BY_MONTH] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SPENDINGS_SEARCH] });
    },
    onError: () => toast.error(t.saveFailed),
  });

  return { saved, proposal, save };
};

export default useReceiptLines;
