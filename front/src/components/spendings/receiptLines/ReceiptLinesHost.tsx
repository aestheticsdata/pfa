"use client";

import ReceiptLinesModal from "@components/spendings/receiptLines/ReceiptLinesModal";
import useReceiptLinesStore from "@components/spendings/stores/receiptLinesStore";
import { useEffect } from "react";

/** Renders the receipt-lines modal of the Spendings page; leaving the page closes it (PFA-214). */
const ReceiptLinesHost = () => {
  const target = useReceiptLinesStore((state) => state.target);
  const close = useReceiptLinesStore((state) => state.close);

  useEffect(() => close, [close]);

  if (!target) return null;

  return (
    <ReceiptLinesModal
      key={target.spendingID}
      target={target}
    />
  );
};

export default ReceiptLinesHost;
