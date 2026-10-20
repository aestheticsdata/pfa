import { bulkReadStatusQuery, nextProposalQuery } from "@components/prices/services/queries";
import { RECEIPT_LINES_MODE } from "@components/spendings/config/constants";
import useReceiptLinesStore from "@components/spendings/stores/receiptLinesStore";
import useRequestHelper from "@helpers/useRequestHelper";
import { parseResponse } from "@src/schemas/parseResponse";
import { BulkReadStatusSchema } from "@src/schemas/receiptLines";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// While receipts are being read, the progress is polled this often.
const POLL_MS = 2000;
const ENDPOINT = "/receipt-proposals";

/**
 * The user's saved receipts read in bulk (PFA-223): the progress, starting the
 * read, and the review queue — each read receipt opened in the receipt-lines
 * modal, one after the other, saved or skipped.
 */
const useBulkRead = () => {
  const { privateRequest } = useRequestHelper();
  const queryClient = useQueryClient();
  const open = useReceiptLinesStore((state) => state.open);
  const close = useReceiptLinesStore((state) => state.close);

  const status = useQuery({
    ...bulkReadStatusQuery(privateRequest),
    refetchInterval: (query) => ((query.state.data?.queued ?? 0) > 0 ? POLL_MS : false),
  });

  const start = useMutation({
    mutationFn: async () => {
      const response = await privateRequest(ENDPOINT, { method: "POST" });
      return parseResponse(BulkReadStatusSchema, response.data, ENDPOINT);
    },
    onSuccess: (started) => queryClient.setQueryData(bulkReadStatusQuery(privateRequest).queryKey, started),
  });

  /** Opens the next read receipt in the review modal, or ends the queue. */
  const reviewNext = async () => {
    const [next, progress] = await Promise.all([
      queryClient.fetchQuery({ ...nextProposalQuery(privateRequest), staleTime: 0 }),
      queryClient.fetchQuery({ ...bulkReadStatusQuery(privateRequest), staleTime: 0 }),
    ]);
    if (!next) {
      close();
      return;
    }
    open({
      spendingID: next.spendingID,
      label: next.label,
      amount: next.amount,
      mode: RECEIPT_LINES_MODE.review,
      queue: {
        proposal: next.proposal,
        remaining: progress.ready,
        onDone: reviewNext,
        onSkip: async () => {
          await privateRequest(`${ENDPOINT}/${next.spendingID}/skip`, { method: "POST" });
          await reviewNext();
        },
      },
    });
  };

  return { status, start, reviewNext };
};

export default useBulkRead;
