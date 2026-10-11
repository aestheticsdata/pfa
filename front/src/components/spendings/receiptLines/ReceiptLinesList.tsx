import { COVERAGE_ROW } from "@components/spendings/invoiceModal/coverageRow";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";

import type { ReceiptLine } from "@src/schemas/receiptLines";

interface ReceiptLinesListProps {
  lines: ReceiptLine[];
}

/**
 * label · amount, then the generic product, count and size — a spending's saved
 * receipt lines, read-only (PFA-214, PFA-219).
 */
const ReceiptLinesList = ({ lines }: ReceiptLinesListProps) => {
  const { euro } = useFormat();
  const { receiptLines: t } = useTranslations("spendings");
  const measure = (line: ReceiptLine) =>
    [
      line.quantity !== 1 && `× ${String(line.quantity).replace(".", ",")}`,
      line.size !== null && line.sizeUnit && `${String(line.size).replace(".", ",")} ${t.sizeUnits[line.sizeUnit]}`,
    ]
      .filter(Boolean)
      .join(" · ");

  if (lines.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-4">{t.noLines}</p>;
  }

  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface-base">
      {lines.map((line, index) => (
        <div
          // The saved set has no ids: its order is its identity.
          // biome-ignore lint/suspicious/noArrayIndexKey: read-only list, never reordered
          key={index}
          data-testid="receipt-line-view"
          className={cn(COVERAGE_ROW, "grid-cols-[minmax(0,1fr)_auto]")}
        >
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm text-ink-2">{line.label}</span>
            {(line.productType || measure(line)) && (
              <span className="flex min-w-0 items-center gap-2 text-xs text-ink-4">
                {line.productType && (
                  <span className="truncate rounded-sm bg-surface-hi px-1.5 py-0.5 text-ink-3">{line.productType}</span>
                )}
                <span className="num shrink-0">{measure(line)}</span>
              </span>
            )}
          </span>
          <span className={cn("num text-sm", line.amount < 0 ? "text-accent-strong" : "text-ink")}>
            {euro(line.amount)}
            <span className="text-xs text-ink-3"> €</span>
          </span>
        </div>
      ))}
    </div>
  );
};

export default ReceiptLinesList;
