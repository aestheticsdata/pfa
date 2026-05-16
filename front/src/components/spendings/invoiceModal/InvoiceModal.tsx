"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
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
import InvoiceImageModal from "./invoiceImageModal/InvoiceImageModal";
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
  const [invoicefile, setInvoicefile] = useState<File | "">("");
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null);
  const [isFileTooBig, setIsFileTooBig] = useState(false);
  const [isInvalidFile, setIsInvalidFile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isClickOnThumbnail, setIsClickOnThumbnail] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [isProgress, setIsProgress] = useState(false);
  const [showConfirmDeleteImage, setShowConfirmDeleteImage] = useState(false);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvoicefile(file);
      setIsInvalidFile(false);
    }
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
        setInvoicefile("");
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
      await queryClient.invalidateQueries([QUERY_KEYS.SPENDINGS_BY_MONTH]);
      setIsLoading(false);
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      if (message === "INVALID_IMAGE_FILE") {
        setIsInvalidFile(true);
        setInvoicefile("");
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

  const onSubmit = () => {
    setIsFileTooBig(false);
    setIsInvalidFile(false);
    if (!userID) return;
    if (!(invoicefile instanceof File)) return;

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
    formData.append("invoiceImageUpload", invoicefile);

    if (invoicefile.size > FILE_SIZE_LIMIT) {
      setIsFileTooBig(true);
    } else {
      uploadInvoiceImage(formData);
    }
  };

  const category = "category" in spending ? spending.category : null;
  const categoryColor =
    "categoryColor" in spending && spending.categoryColor
      ? spending.categoryColor
      : "#94a3b8";

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClickOutside()}>
        <DialogContent className="bg-gradient-to-br from-[#121212] via-[#0a0a0a] to-black border-gray-800 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-gray-100">
              <span className="truncate max-w-[260px]" title={spending.label}>
                {spending.label}
              </span>
              {category && (
                <span
                  className="px-2 py-0.5 rounded text-[10px] uppercase font-medium"
                  style={{
                    backgroundColor: categoryColor + "30",
                    color: categoryColor,
                  }}
                >
                  {category}
                </span>
              )}
              <span className="ml-auto text-cyan-400 text-sm tabular-nums">
                {Number(spending.amount).toFixed(2)} €
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex justify-center items-center min-h-[200px] border border-gray-800/50 bg-[#0c0c0c] rounded-lg overflow-hidden">
            {isLoading && !isProgress ? (
              <Spinner />
            ) : invoiceImage ? (
              <Image
                src={invoiceImage}
                width={300}
                height={250}
                alt="invoice"
                onClick={() => setIsClickOnThumbnail(true)}
                className="cursor-pointer max-w-full max-h-full object-contain"
                unoptimized
              />
            ) : (
              <div className="text-gray-500 text-sm">
                {invoiceModalTexts.noInvoice}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 items-center">
            {isFileTooBig && (
              <p className="text-destructive text-sm">
                {invoiceModalTexts.fileTooBig}
              </p>
            )}
            {isInvalidFile && (
              <p className="text-destructive text-sm">
                {invoiceModalTexts.invalidFileType}
              </p>
            )}

            {isProgress ? (
              <div className="flex flex-col gap-2 w-full">
                <span className="text-gray-300 text-xs text-right">
                  {progressValue} %
                </span>
                <div className="h-2 bg-gray-800 rounded overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 transition-all"
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
              </div>
            ) : invoiceImage && !isLoading ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowConfirmDeleteImage(true)}
              >
                <Trash2 className="w-4 h-4" />
                {invoiceModalTexts.delete}
              </Button>
            ) : (
              !isLoading && (
                <>
                  <input
                    className="hidden"
                    type="file"
                    id="invoicefileinputid"
                    name="invoicefile"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={onChange}
                  />
                  <label
                    htmlFor="invoicefileinputid"
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 w-full p-6 border-2 border-dashed border-gray-700/50 rounded-lg cursor-pointer hover:border-cyan-600 hover:bg-[#0c0c0c] transition-colors text-gray-300",
                    )}
                  >
                    {invoicefile !== "" ? (
                      <>
                        <span className="text-sm">
                          {(invoicefile as File).name}
                        </span>
                        <Button
                          type="button"
                          variant="cyan"
                          onClick={onSubmit}
                        >
                          {invoiceModalTexts.send}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-cyan-500" />
                        <span className="font-medium text-gray-200">
                          {invoiceModalTexts.chooseFile}
                        </span>
                        <span className="text-xs text-gray-500">
                          {invoiceModalTexts.fileTypeWarning}
                        </span>
                      </>
                    )}
                  </label>
                </>
              )
            )}
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
        <AlertDialogContent className="bg-gradient-to-br from-[#121212] via-[#0a0a0a] to-black border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-100">
              Supprimer la facture ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700/50 bg-[#0c0c0c] text-gray-200 hover:bg-[#151515]">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteImage();
                setShowConfirmDeleteImage(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
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
