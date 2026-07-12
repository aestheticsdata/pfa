"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import { Upload, Trash2 } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@components/ui/alert-dialog";
import { Button } from "@components/ui/button";
import useRequestHelper from "@helpers/useRequestHelper";
import { useAuth } from "@auth/context/AuthContext";
import InvoiceImageModal from "@components/spendings/invoiceModal/invoiceImageModal/InvoiceImageModal";
import texts from "@components/spendings/config/text";
import Spinner from "@components/common/Spinner";
import { QUERY_KEYS } from "@components/spendings/config/constants";
import { cn } from "@lib/utils";

import type { SpendingListItem } from "@components/spendings/types";

interface InvoiceModalProps {
  handleClickOutside: () => void;
  spending: SpendingListItem & {
    category?: string | null;
    categoryColor?: string | null;
    date?: string;
    dateFrom?: string;
  };
}

const FILE_SIZE_LIMIT = 32_097_152;
const FALLBACK_COLOR = "#94a3b8";

const InvoiceModal = ({
  handleClickOutside: handleClickOutsideProp,
  spending,
}: InvoiceModalProps) => {
  const [open, setOpen] = useState(true);
  const handleClickOutside = () => {
    setOpen(false);
    setTimeout(handleClickOutsideProp, 200);
  };
  const { privateRequest } = useRequestHelper();
  const queryClient = useQueryClient();
  const { invoiceModal: invoiceModalTexts } = texts;
  const { user } = useAuth();
  const userID = user?.id;
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null);
  const [isFileTooBig, setIsFileTooBig] = useState(false);
  const [isInvalidFile, setIsInvalidFile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isClickOnThumbnail, setIsClickOnThumbnail] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [isProgress, setIsProgress] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmDeleteImage, setShowConfirmDeleteImage] = useState(false);
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
      if (
        (res as { data?: { msg?: string } })?.data?.msg ===
        "INVOICE_IMAGE_DELETED"
      ) {
        setInvoiceImage(null);
        await queryClient.invalidateQueries([QUERY_KEYS.SPENDINGS_BY_MONTH]);
        setIsLoading(false);
      }
    } catch (e) {
      console.log("error deleting image : ", e);
      setIsLoading(false);
    }
  };

  const uploadInvoiceImage = async (payload: FormData) => {
    const config = {
      onUploadProgress: (progressEvent: ProgressEvent) => {
        const value = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
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
      const uploadedImage = await privateRequest(
        "/spendings/upload",
        { method: "POST", data: payload },
        config,
      );
      setInvoiceImage(uploadedImage.data);
      clearPending();
      await queryClient.invalidateQueries([QUERY_KEYS.SPENDINGS_BY_MONTH]);
      setIsLoading(false);
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      if (message === "INVALID_IMAGE_FILE") {
        setIsInvalidFile(true);
      }
      setIsProgress(false);
      setIsLoading(false);
    }
  };

  const getInvoiceImage = async () => {
    try {
      const res = await privateRequest(
        `/spendings/upload/${spending.ID}?userID=${userID}&itemType=${spending.itemType}`,
      );
      setInvoiceImage(res.data);
    } catch (e) {
      console.log("error getting image : ", e);
      setInvoiceImage(null);
    } finally {
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

    const formData = new FormData();
    formData.append("userID", userID);

    switch (spending.itemType) {
      case "recurring":
        formData.append("itemType", "recurring");
        if (spending.dateFrom) {
          formData.append("dateFrom", spending.dateFrom);
        }
        break;
      case "spending":
        formData.append("itemType", "spending");
        if (spending.date) {
          formData.append("date", spending.date);
        }
        break;
      default:
        break;
    }

    formData.append("label", spending.label);
    formData.append("spendingID", spending.ID);
    formData.append("invoiceImageUpload", pendingFile);

    uploadInvoiceImage(formData);
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      selectFile(file);
    }
  };

  const category = "category" in spending ? spending.category : null;
  const categoryColor =
    "categoryColor" in spending && spending.categoryColor
      ? spending.categoryColor
      : FALLBACK_COLOR;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => !isOpen && handleClickOutside()}
      >
        <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto border-line bg-bg-elev p-0 sm:max-w-[600px]">
          <DialogHeader className="flex-row items-center gap-3 space-y-0 pb-4 pl-[22px] pr-14 pt-5 text-left">
            <DialogTitle
              className="min-w-0 flex-1 truncate pr-8 text-[21px] font-semibold tracking-[-0.02em] text-ink"
              title={spending.label}
            >
              {spending.label}
            </DialogTitle>
            {category && (
              <span
                className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{
                  backgroundColor: categoryColor + "30",
                  color: categoryColor,
                }}
              >
                {category}
              </span>
            )}
            <span className="num shrink-0 whitespace-nowrap text-[19px] font-semibold tracking-[-0.02em] text-elec">
              {Number(spending.amount).toFixed(2)} €
            </span>
          </DialogHeader>

          {/* #b3ada4 is the design's neutral tan backdrop behind receipt photos
              (from .facture-stage.is-image) — intentionally a fixed value, not a
              palette token. */}
          <div
            className={cn(
              "mx-[22px] overflow-hidden rounded-[14px] border border-line",
              invoiceImage || pendingPreview ? "bg-[#b3ada4]" : "bg-background",
            )}
          >
            {isLoading && !isProgress ? (
              <div className="grid min-h-[300px] place-items-center">
                <Spinner />
              </div>
            ) : invoiceImage ? (
              <button
                type="button"
                onClick={() => setIsClickOnThumbnail(true)}
                className="block w-full cursor-zoom-in"
                aria-label="Agrandir la facture"
              >
                <Image
                  src={invoiceImage}
                  width={1000}
                  height={800}
                  alt="facture"
                  className="block max-h-[min(460px,60vh)] w-full object-contain"
                  unoptimized
                />
              </button>
            ) : pendingPreview ? (
              <Image
                src={pendingPreview}
                width={1000}
                height={800}
                alt="aperçu de la facture"
                className="block max-h-[min(460px,60vh)] w-full object-contain"
                unoptimized
              />
            ) : (
              <div className="grid min-h-[300px] place-items-center text-base tracking-[-0.01em] text-ink-4">
                {invoiceModalTexts.noInvoice}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 px-[22px] pb-[22px] pt-[18px]">
            {isFileTooBig && (
              <p className="text-center text-sm text-neg">
                {invoiceModalTexts.fileTooBig}
              </p>
            )}
            {isInvalidFile && (
              <p className="text-center text-sm text-neg">
                {invoiceModalTexts.invalidFileType}
              </p>
            )}

            {isProgress ? (
              <div className="flex flex-col gap-2">
                <span className="num text-right text-xs text-ink-3">
                  {progressValue} %
                </span>
                <div className="h-2 overflow-hidden rounded bg-bg-hi">
                  <div
                    className="h-full bg-elec transition-all"
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
              </div>
            ) : invoiceImage && !isLoading ? (
              <button
                type="button"
                onClick={() => setShowConfirmDeleteImage(true)}
                className="inline-flex items-center justify-center gap-2.5 rounded-[10px] border border-[oklch(0.55_0.15_25)] bg-[oklch(0.47_0.14_25)] px-[18px] py-3.5 text-[15px] font-semibold text-[oklch(0.98_0.02_25)] transition-[filter] hover:brightness-110"
              >
                <Trash2 className="size-4" />
                {invoiceModalTexts.delete}
              </button>
            ) : pendingPreview && !isLoading ? (
              <div className="flex gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={clearPending}
                  className="flex-1 border-line bg-background text-[15px] text-ink-2 hover:bg-bg-hi"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={sendInvoice}
                  className="flex-1 text-[15px]"
                >
                  {invoiceModalTexts.send}
                </Button>
              </div>
            ) : !isLoading ? (
              <>
                <input
                  className="hidden"
                  type="file"
                  id="invoicefileinputid"
                  name="invoicefile"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      selectFile(file);
                    }
                    e.currentTarget.value = "";
                  }}
                />
                <label
                  htmlFor="invoicefileinputid"
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={onDrop}
                  className={cn(
                    // children are pointer-events-none so drag events target the
                    // label itself (no flicker when hovering child elements)
                    "flex cursor-pointer flex-col items-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed px-[22px] py-[30px] text-center transition-colors [&_*]:pointer-events-none",
                    isDragging
                      ? "border-elec bg-elec/[0.06]"
                      : "border-line hover:border-elec hover:bg-elec/[0.06]",
                  )}
                >
                  <Upload className="size-[30px] text-elec" />
                  <span className="text-[17px] font-semibold text-ink">
                    {invoiceModalTexts.chooseFile}
                  </span>
                  <span className="num text-[13px] text-ink-4">
                    {invoiceModalTexts.fileTypeWarning}
                  </span>
                </label>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {isClickOnThumbnail && invoiceImage && (
        <InvoiceImageModal
          image={invoiceImage}
          closeImage={() => setIsClickOnThumbnail(false)}
        />
      )}

      <AlertDialog
        open={showConfirmDeleteImage}
        onOpenChange={setShowConfirmDeleteImage}
      >
        <AlertDialogContent className="border-line bg-bg-elev">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ink">
              Supprimer la facture&nbsp;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-ink-3">
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-line bg-background text-ink-2 hover:bg-bg-hi">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteImage();
                setShowConfirmDeleteImage(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InvoiceModal;
