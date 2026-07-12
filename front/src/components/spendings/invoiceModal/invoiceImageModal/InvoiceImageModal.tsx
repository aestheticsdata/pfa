"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@components/ui/dialog";

interface InvoiceImageModalProps {
  image: string;
  closeImage: () => void;
}

const InvoiceImageModal = ({
  image,
  closeImage: closeImageProp,
}: InvoiceImageModalProps) => {
  const [open, setOpen] = useState(true);
  const closeImage = () => {
    setOpen(false);
    setTimeout(closeImageProp, 200);
  };
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && closeImage()}>
      <DialogContent className="w-auto max-w-none sm:max-w-none border-0 bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">Facture — aperçu</DialogTitle>
        <div className="overflow-hidden rounded-xl border border-elec/30 shadow-[0_24px_80px_oklch(0_0_0/0.6)] leading-[0]">
          <Image
            src={image}
            alt="facture"
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
