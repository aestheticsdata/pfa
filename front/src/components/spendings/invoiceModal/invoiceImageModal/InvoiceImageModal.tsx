"use client";

import { Dialog, DialogContent, DialogTitle } from "@components/ui/dialog";
import spendings from "@text/spendings";
import Image from "next/image";
import { useState } from "react";

interface InvoiceImageModalProps {
  image: string;
  closeImage: () => void;
}

const InvoiceImageModal = ({ image, closeImage: closeImageProp }: InvoiceImageModalProps) => {
  const [open, setOpen] = useState(true);
  const closeImage = () => {
    setOpen(false);
    setTimeout(closeImageProp, 200);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeImage()}
    >
      <DialogContent className="w-auto max-w-none sm:max-w-none border-0 bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">{spendings.invoiceModal.lightboxTitle}</DialogTitle>
        <div className="overflow-hidden rounded-xl border border-elec/30 shadow-lightbox leading-[0]">
          <Image
            src={image}
            alt={spendings.invoiceModal.imageAlt}
            width={1000}
            height={800}
            unoptimized
            className="block h-auto max-h-[90vh] w-auto max-w-[min(94vw,1100px)]"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceImageModal;
