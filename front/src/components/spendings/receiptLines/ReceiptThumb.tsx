import Spinner from "@components/common/Spinner";
import InvoiceImageModal from "@components/spendings/invoiceModal/invoiceImageModal/InvoiceImageModal";
import useReceiptImage from "@components/spendings/services/useReceiptImage";
import useTranslations from "@i18n/useTranslations";
import Image from "next/image";
import { useState } from "react";

interface ReceiptThumbProps {
  spendingID: string;
}

/**
 * The receipt beside its lines, to correct them against it (PFA-214). Opens
 * the receipt lightbox on click. #b3ada4 is the receipt modal's tan backdrop.
 */
const ReceiptThumb = ({ spendingID }: ReceiptThumbProps) => {
  const { invoiceModal, receiptLines } = useTranslations("spendings");
  const { data: image, isPending } = useReceiptImage(spendingID);
  const [isEnlarged, setIsEnlarged] = useState(false);

  if (!isPending && !image) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-[#b3ada4] md:sticky md:top-0">
      {isPending || !image ? (
        <div className="grid min-h-40 place-items-center">
          <Spinner />
        </div>
      ) : (
        <button
          type="button"
          data-testid="receipt-lines-thumb"
          onClick={() => setIsEnlarged(true)}
          className="block w-full cursor-zoom-in"
          aria-label={invoiceModal.enlargeAria}
        >
          <Image
            src={image}
            width={600}
            height={900}
            alt={receiptLines.thumbAlt}
            className="block max-h-[min(520px,40vh)] w-full object-contain md:max-h-[min(560px,65vh)]"
            unoptimized
          />
        </button>
      )}
      {isEnlarged && image && (
        <InvoiceImageModal
          image={image}
          closeImage={() => setIsEnlarged(false)}
        />
      )}
    </div>
  );
};

export default ReceiptThumb;
