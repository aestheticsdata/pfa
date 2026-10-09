import { useAuth } from "@auth/context/AuthContext";
import { buildSharedReceiptFormData } from "@components/spendings/services/invoiceUploadFormData";
import useSpendings from "@components/spendings/services/useSpendings";
import useRequestHelper from "@helpers/useRequestHelper";
import useTranslations from "@i18n/useTranslations";
import { CreateSpendingGroupResponseSchema } from "@src/schemas/spendings";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import type {
  CreateSpendingGroupInput,
  MergeSpendingGroupInput,
  ShareReceiptInput,
  SpendingGroupLinePayload,
  UpdateSpendingGroupInput,
} from "@components/spendings/interfaces/spendingGroupTypes";
import type { AxiosError } from "axios";

const MergeResponseSchema = z.object({ ID: z.string(), invoicefile: z.string().nullable() });

// A line's category goes as the single-spending flow sends it: an existing one
// by ID, a typed one by name + colour, none at all when left empty.
const toLineBody = ({ ID, detail, amount, category }: SpendingGroupLinePayload) => ({
  ...(ID ? { ID } : {}),
  detail: detail.trim(),
  amount,
  ...(category?.name ? { category: { ID: category.ID, name: category.name, color: category.color } } : {}),
});

/**
 * Groups of spendings on one receipt, and receipts shared by several spendings
 * (PFA-189). Every mutation refreshes the same queries as a plain spending's.
 */
const useSpendingGroups = () => {
  const texts = useTranslations("spendings");
  const { toasts } = texts;
  const { privateRequest } = useRequestHelper();
  const { user } = useAuth();
  const { refreshAfterMutation } = useSpendings();

  const shareReceiptRequest = (input: ShareReceiptInput) =>
    privateRequest("/spendings/receipts", { method: "POST", data: buildSharedReceiptFormData(input) });

  // The group exists once its rows are written: a failed receipt upload only
  // warns, the row's receipt icon is the retry path (same rule as PFA-5).
  const attachAfterCreation = async (input: ShareReceiptInput) => {
    try {
      await shareReceiptRequest(input);
    } catch (e) {
      console.log("error attaching the group's receipt : ", e);
      toast.error(toasts.receiptUploadFailed);
    }
  };

  const createGroup = useMutation<unknown, AxiosError, CreateSpendingGroupInput>({
    mutationFn: async ({ date, label, currency, lines, receiptFile }) => {
      const response = await privateRequest("/spendings/groups", {
        method: "POST",
        data: { date, label, currency, lines: lines.map(toLineBody) },
      });
      if (receiptFile) {
        const { spendingIDs } = CreateSpendingGroupResponseSchema.parse(response.data);
        await attachAfterCreation({ spendingIDs, file: receiptFile, label, date });
      }
      return response;
    },
    onSuccess: () => refreshAfterMutation(toasts.groupCreated),
  });

  const updateGroup = useMutation<unknown, AxiosError, UpdateSpendingGroupInput>({
    mutationFn: ({ ID, label, lines }) =>
      privateRequest(`/spendings/groups/${ID}`, { method: "PUT", data: { label, lines: lines.map(toLineBody) } }),
    onSuccess: () => refreshAfterMutation(toasts.groupUpdated),
  });

  const deleteGroup = useMutation<unknown, AxiosError, string>({
    mutationFn: (groupID) => privateRequest(`/spendings/groups/${groupID}`, { method: "DELETE" }),
    onSuccess: () => refreshAfterMutation(toasts.groupDeleted),
  });

  const ungroup = useMutation<unknown, AxiosError, string>({
    mutationFn: (groupID) => privateRequest(`/spendings/groups/${groupID}/ungroup`, { method: "POST" }),
    onSuccess: () => refreshAfterMutation(toasts.ungrouped),
  });

  const mergeGroup = useMutation<string, AxiosError, MergeSpendingGroupInput>({
    mutationFn: async ({ label, date, lines, receiptFile }) => {
      const response = await privateRequest("/spendings/groups/merge", {
        method: "POST",
        data: { label, lines: lines.map(({ spendingID, detail }) => ({ spendingID, detail: detail.trim() })) },
      });
      const { ID, invoicefile } = MergeResponseSchema.parse(response.data);
      if (receiptFile && !invoicefile) {
        await attachAfterCreation({ spendingIDs: lines.map((l) => l.spendingID), file: receiptFile, label, date });
      }
      return ID;
    },
    onSuccess: () => refreshAfterMutation(toasts.grouped),
  });

  const shareReceipt = useMutation<unknown, AxiosError, ShareReceiptInput>({
    mutationFn: shareReceiptRequest,
    onSuccess: () => refreshAfterMutation(toasts.receiptShared),
    onError: () => {
      toast.error(toasts.receiptUploadFailed);
    },
  });

  const detachReceipt = useMutation<unknown, AxiosError, string[]>({
    mutationFn: (spendingIDs) =>
      privateRequest("/spendings/receipts/detach", { method: "POST", data: { spendingIDs } }),
    onSuccess: () => refreshAfterMutation(toasts.receiptDetached),
  });

  return {
    currency: user?.baseCurrency ?? null,
    createGroup,
    updateGroup,
    deleteGroup,
    ungroup,
    mergeGroup,
    shareReceipt,
    detachReceipt,
  };
};

export default useSpendingGroups;
