import { useAuth } from "@auth/context/AuthContext";
import {
  buildInvoiceUploadFormData,
  buildSharedReceiptFormData,
} from "@components/spendings/services/invoiceUploadFormData";
import useRequestHelper from "@helpers/useRequestHelper";
import useTranslations from "@i18n/useTranslations";
import { invalidateFamilies } from "@lib/query/invalidate";
import { QUERY_KEYS } from "@lib/query/keys";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { InvoiceImageTarget } from "@components/spendings/interfaces/receiptModalTypes";

const FILE_SIZE_LIMIT = 32_097_152;

/** The image routes answer with a `data:` URL string, or JSON `null` when there is none. */
const asImageSource = (data: unknown) => (typeof data === "string" && data !== "" ? data : null);

/**
 * A row's receipt image (PFA-250, moved out of InvoiceModal): loading it, staging a
 * picked file for preview, uploading it — to every spending of a shared receipt —
 * with progress, and deleting it.
 */
const useInvoiceImage = ({ spending, uploadSpendingIDs, sharedLabel }: InvoiceImageTarget) => {
  const isSharedUpload = (uploadSpendingIDs?.length ?? 0) > 1;
  const common = useTranslations("common");
  const { privateRequest } = useRequestHelper();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userID = user?.id;
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null);
  const [isFileTooBig, setIsFileTooBig] = useState(false);
  const [isInvalidFile, setIsInvalidFile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progressValue, setProgressValue] = useState(0);
  const [isProgress, setIsProgress] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);

  const clearPending = () => {
    setPendingFile(null);
    setPendingPreview(null);
  };

  const deleteImage = async () => {
    try {
      setIsLoading(true);
      const res = await privateRequest("/spendings/upload", {
        method: "DELETE",
        data: spending,
      });
      if ((res as { data?: { msg?: string } })?.data?.msg === "INVOICE_IMAGE_DELETED") {
        setInvoiceImage(null);
        await invalidateFamilies(queryClient, [QUERY_KEYS.SPENDINGS_BY_MONTH]);
        setIsLoading(false);
      }
    } catch {
      toast.error(common.mutationFailed);
      setIsLoading(false);
    }
  };

  const getInvoiceImage = async () => {
    try {
      const res = await privateRequest(`/spendings/upload/${spending.ID}?itemType=${spending.itemType}`);
      setInvoiceImage(asImageSource(res.data));
    } catch {
      setInvoiceImage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadInvoiceImage = async (payload: FormData) => {
    const options = {
      method: "POST",
      data: payload,
      onUploadProgress: (progressEvent: ProgressEvent) => {
        const value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgressValue(value);
        if (value === 100) {
          setIsProgress(false);
          setProgressValue(0);
        }
      },
    };
    try {
      setIsProgress(true);
      setIsLoading(true);
      const endpoint = isSharedUpload ? "/spendings/receipts" : "/spendings/upload";
      const uploadedImage = await privateRequest(endpoint, options);
      if (isSharedUpload) {
        // The shared endpoint answers with the stored name, not the image.
        await getInvoiceImage();
      } else {
        setInvoiceImage(asImageSource(uploadedImage.data));
      }
      clearPending();
      await invalidateFamilies(queryClient, [QUERY_KEYS.SPENDINGS_BY_MONTH]);
      setIsLoading(false);
      // Reading the lines stays the user's call: no OCR on upload (PFA-226).
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (message === "INVALID_IMAGE_FILE") {
        setIsInvalidFile(true);
      }
      setIsProgress(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getInvoiceImage();
  }, []);

  // Free the local blob URL when the pending preview changes or the modal unmounts
  useEffect(() => {
    if (!pendingPreview) return;
    return () => URL.revokeObjectURL(pendingPreview);
  }, [pendingPreview]);

  // Selecting/dropping a file only stages it locally (preview) — the upload is
  // deferred until the user confirms with « Envoyer » (see sendInvoice).
  const selectFile = (file: File) => {
    setIsFileTooBig(false);
    setIsInvalidFile(false);
    if (!userID) return;
    if (!file.type.startsWith("image/")) {
      setIsInvalidFile(true);
      return;
    }
    if (file.size > FILE_SIZE_LIMIT) {
      setIsFileTooBig(true);
      return;
    }

    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
  };

  const sendInvoice = () => {
    if (!pendingFile || !userID) return;
    uploadInvoiceImage(
      isSharedUpload && uploadSpendingIDs && "date" in spending && spending.date
        ? buildSharedReceiptFormData({
            spendingIDs: uploadSpendingIDs,
            file: pendingFile,
            label: sharedLabel ?? spending.label,
            date: spending.date.slice(0, 10),
          })
        : buildInvoiceUploadFormData(spending, pendingFile),
    );
  };

  return {
    isSharedUpload,
    invoiceImage,
    pendingPreview,
    isLoading,
    isProgress,
    progressValue,
    isFileTooBig,
    isInvalidFile,
    selectFile,
    sendInvoice,
    clearPending,
    deleteImage,
  };
};

export default useInvoiceImage;
