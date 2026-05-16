"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
} from "@components/ui/dialog";

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
      <DialogContent className="bg-[#0a0a0a] border-gray-800 max-w-[90vw] sm:max-w-3xl p-0 overflow-hidden">
        <div className="max-h-[85vh] overflow-y-auto p-4 flex justify-center">
          <Image
            src={image}
            alt="invoice"
            width={1000}
            height={800}
            unoptimized
            className="max-w-full h-auto"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceImageModal;
