import { IconButton } from "@components/shared/IconButton";
import { DAY_ENTRY_KIND } from "@components/spendings/config/constants";
import { entryPill } from "@components/spendings/helpers/dayEntries";
import { COVERAGE_ROW } from "@components/spendings/invoiceModal/coverageRow";
import GroupCount from "@components/spendings/view/rows/GroupCount";
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import format from "date-fns/format";
import parseISO from "date-fns/parseISO";
import { X } from "lucide-react";

import type { DayEntry } from "@components/spendings/interfaces/spendingGroupTypes";

interface SharedEntriesListProps {
  entries: DayEntry[];
  /** Detaches one entry from the receipt; absent = read-only list. */
  onDetach?: (entry: DayEntry) => void;
}

/** pill · label · date · amount (· detach) — the spendings one receipt covers (PFA-189). */
const SharedEntriesList = ({ entries, onDetach }: SharedEntriesListProps) => {
  const { groups: t } = useTranslations("spendings");
  const { euro } = useFormat();
  const dateLocale = useDateLocale();

  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface-base">
      {entries.map((entry) => (
        <div
          key={entry.ID}
          data-testid="receipt-covered-entry"
          className={cn(
            COVERAGE_ROW,
            onDetach
              ? "grid-cols-[0.1875rem_minmax(0,1fr)_auto_auto_1.75rem]"
              : "grid-cols-[0.1875rem_minmax(0,1fr)_auto_auto]",
          )}
        >
          <span
            className="h-4 w-0.75 rounded-xs"
            style={{ background: entryPill(entry) }}
          />
          <span className="flex min-w-0 items-center gap-1.5 text-sm text-ink-2">
            <span className="truncate">{entry.label}</span>
            {entry.kind === DAY_ENTRY_KIND.group && <GroupCount count={entry.lines.length} />}
          </span>
          <span className="num text-xs text-ink-4">
            {format(parseISO(entry.date), "dd MMM", { locale: dateLocale })}
          </span>
          <span className="num text-sm text-ink">
            {euro(entry.amount)}
            <span className="text-xs text-ink-3"> €</span>
          </span>
          {onDetach && (
            <IconButton
              variant="danger"
              size={6}
              title={t.receipt.detach}
              aria-label={t.receipt.detach}
              onClick={() => onDetach(entry)}
            >
              <X />
            </IconButton>
          )}
        </div>
      ))}
    </div>
  );
};

export default SharedEntriesList;
