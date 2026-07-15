"use client";

import ExportButton from "@components/shared/ExportButton";
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
        placeholder="Rechercher une dépense…"
        className="w-full rounded-md border border-line bg-surface-elev py-2 pl-8 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-accent-d"
      />
    </div>

    {/* order-last stacks it under the search field on mobile — the field is itself
        pushed down there by its own order-10, so anything less would land above it.
        From sm both reset and this fills the span left before the export button.
        empty:hidden because a slot that renders null (the filter does, on a week
        with no categories) still leaves this wrapper holding a full-width flex
        line, i.e. a phantom gap-3 row. */}
    <div className="order-last w-full min-w-0 empty:hidden sm:order-none sm:flex-1">{children}</div>

    <div className="ml-auto flex items-center gap-2.5">
      <ExportButton />
    </div>
  </div>
);

export default SpendingToolbar;
