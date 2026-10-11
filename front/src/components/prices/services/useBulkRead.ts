import { RECEIPT_LINES_MODE } from "@components/spendings/config/constants";
import useReceiptLinesStore from "@components/spendings/stores/receiptLinesStore";
import useRequestHelper from "@helpers/useRequestHelper";
import { QUERY_KEYS } from "@lib/query/keys";
import { parseResponse } from "@src/schemas/parseResponse";
import { BulkReadStatusSchema, PendingProposalSchema } from "@src/schemas/receiptLines";
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

  const fetchStatus = async () => {
    const response = await privateRequest(ENDPOINT);
    return parseResponse(BulkReadStatusSchema, response.data, ENDPOINT);
  };

  const status = useQuery({
    queryKey: [QUERY_KEYS.RECEIPT_PROPOSALS],
    queryFn: fetchStatus,
    refetchInterval: (query) => ((query.state.data?.queued ?? 0) > 0 ? POLL_MS : false),
  });

  const start = useMutation({
    mutationFn: async () => {
      const response = await privateRequest(ENDPOINT, { method: "POST" });
      return parseResponse(BulkReadStatusSchema, response.data, ENDPOINT);
    },
    onSuccess: (started) => queryClient.setQueryData([QUERY_KEYS.RECEIPT_PROPOSALS], started),
  });

  /** Opens the next read receipt in the review modal, or ends the queue. */
  const reviewNext = async () => {
    const [next, progress] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: [QUERY_KEYS.RECEIPT_PROPOSAL_NEXT],
        queryFn: async () => {
          const response = await privateRequest(`${ENDPOINT}/next`);
          return parseResponse(PendingProposalSchema, response.data, `${ENDPOINT}/next`);
        },
        staleTime: 0,
      }),
      queryClient.fetchQuery({ queryKey: [QUERY_KEYS.RECEIPT_PROPOSALS], queryFn: fetchStatus, staleTime: 0 }),
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
