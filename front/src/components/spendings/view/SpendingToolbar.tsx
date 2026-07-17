"use client";

import ExportButton from "@components/shared/ExportButton";
import SpendingSearchTrigger from "@components/spendings/search/SpendingSearchTrigger";
import spendings from "@text/spendings";
import { Search } from "lucide-react";

interface SpendingToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** Rendered in the free span between the search field and the export button. */
  children?: React.ReactNode;
}

const SpendingToolbar = ({ search, onSearchChange, children }: SpendingToolbarProps) => (
  <div className="flex flex-wrap items-center gap-3">
    <div className="relative order-10 w-full sm:order-none sm:w-[280px]">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-4" />
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={spendings.toolbar.searchPlaceholder}
        className="w-full rounded-md border border-line bg-surface-elev py-2 pl-8 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-accent-d"
      />
    </div>

    {/* Whole-history search (COS-118): full-width field stacked under the week
        filter on mobile, compact button beside it from sm. */}
    <div className="order-10 w-full sm:order-none sm:w-auto">
      <SpendingSearchTrigger />
    </div>

    {/* Only from xl (wide desktop) does the category filter sit inline between the
        search and export, flex-1 so it fills the span and stays on one line —
        saving the card height a whole extra row would cost. Below xl the inline
        span crushes to an unusable sliver, so order-last + w-full drops it to its
        own full-width wrapping row (COS-118). empty:hidden because a slot that
        renders null (the filter does, on a week with no categories) would still
        hold a full-width flex line, i.e. a phantom gap-3 row. */}
    <div className="order-last w-full min-w-0 empty:hidden xl:order-none xl:flex-1">{children}</div>

    <div className="ml-auto flex items-center gap-2.5">
      <ExportButton />
    </div>
  </div>
);

export default SpendingToolbar;
