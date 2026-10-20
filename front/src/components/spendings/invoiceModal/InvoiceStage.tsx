import Spinner from "@components/common/Spinner";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import Image from "next/image";

interface InvoiceStageProps {
  isLoading: boolean;
  isProgress: boolean;
  invoiceImage: string | null;
  pendingPreview: string | null;
  onEnlarge: () => void;
}

/** The receipt photo — saved, or the staged preview — or the empty / loading state. */
const InvoiceStage = ({ isLoading, isProgress, invoiceImage, pendingPreview, onEnlarge }: InvoiceStageProps) => {
  const { invoiceModal: texts } = useTranslations("spendings");

  return (
    // #b3ada4 is the design's neutral tan backdrop behind receipt photos
    // (from .facture-stage.is-image) — intentionally a fixed value, not a
    // palette token.
    <div
      className={cn(
        "mx-5.5 overflow-hidden rounded-xl border border-line",
        invoiceImage || pendingPreview ? "bg-[#b3ada4]" : "bg-surface-base",
      )}
    >
      {isLoading && !isProgress ? (
        <div className="grid min-h-[300px] place-items-center">
          <Spinner />
        </div>
      ) : invoiceImage ? (
        <button
          type="button"
          data-testid="receipt-image"
          onClick={onEnlarge}
          className="block w-full cursor-zoom-in"
          aria-label={texts.enlargeAria}
        >
          <Image
            src={invoiceImage}
            width={1000}
            height={800}
            alt={texts.imageAlt}
            className="block max-h-[min(460px,60vh)] w-full object-contain"
            unoptimized
          />
        </button>
      ) : pendingPreview ? (
        <Image
          src={pendingPreview}
          width={1000}
          height={800}
          alt={texts.previewAlt}
          className="block max-h-[min(460px,60vh)] w-full object-contain"
          unoptimized
        />
      ) : (
        <div className="grid min-h-[300px] place-items-center text-base tracking-normal text-ink-4">
          {texts.noInvoice}
        </div>
      )}
    </div>
  );
};

export default InvoiceStage;
