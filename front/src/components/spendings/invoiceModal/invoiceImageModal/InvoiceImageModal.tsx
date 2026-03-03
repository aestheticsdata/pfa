import { useRef } from "react";
import type { RefObject } from "react";
import Image from "next/image";
import useOnClickOutside from 'use-onclickoutside';


const InvoiceImageModal = ({ image, closeImage }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useOnClickOutside(ref as RefObject<HTMLElement>, closeImage);

  return (
    <div className="fixed top-0 left-0 bottom-0 right-0 bg-grey2 z-10">
      <div className="absolute max-h-screen overflow-y-auto">
        <div ref={ref}>
          <Image
            src={image}
            alt="invoice"
            width={800}
            height={600}
            unoptimized
            className="max-w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceImageModal;
