import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import { DialogHeader, DialogTitle } from "@components/ui/dialog";
import useFormat from "@i18n/useFormat";
import { cn } from "@lib/utils";

import type { InvoiceSpending, ReceiptModalHeader } from "@components/spendings/interfaces/receiptModalTypes";

interface InvoiceModalHeaderProps {
  spending: InvoiceSpending;
  /** Replaces the label / category / amount — a group or a shared receipt (PFA-189). */
  header?: ReceiptModalHeader;
}

/** The row's label, its category chip (or the group / shared tag) and its amount. */
const InvoiceModalHeader = ({ spending, header }: InvoiceModalHeaderProps) => {
  const { euro } = useFormat();
  const category = "category" in spending ? spending.category : null;
  const categoryColor =
    "categoryColor" in spending && spending.categoryColor ? spending.categoryColor : CATEGORY_FALLBACK;

  return (
    <DialogHeader className="flex-row items-center gap-3 space-y-0 pb-4 pl-5.5 pr-14 pt-5 text-left">
      <DialogTitle
        className="min-w-0 flex-1 truncate pr-8 text-xl font-semibold tracking-tight text-ink"
        title={header?.title ?? spending.label}
      >
        {header?.title ?? spending.label}
      </DialogTitle>
      {header ? (
        <span
          className={cn(
            "shrink-0 rounded-md px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider",
            header.tagClassName,
          )}
        >
          {header.tag}
        </span>
      ) : (
        category && (
          <span
            className="shrink-0 rounded-md px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider"
            style={{
              backgroundColor: `${categoryColor}30`,
              color: categoryColor,
            }}
          >
            {category}
          </span>
        )
      )}
      <span className="num shrink-0 whitespace-nowrap text-lg font-semibold tracking-tight text-elec">
        {euro(header?.amount ?? spending.amount)} €
      </span>
    </DialogHeader>
  );
};

export default InvoiceModalHeader;
