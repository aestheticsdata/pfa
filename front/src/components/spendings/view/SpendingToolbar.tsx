"use client";

import ExportButton from "@components/shared/ExportButton";
import { Search } from "lucide-react";

interface SpendingToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

const SpendingToolbar = ({ search, onSearchChange }: SpendingToolbarProps) => (
  <div className="flex flex-wrap items-center gap-3">
    <div className="relative order-10 w-full sm:order-none sm:w-[280px]">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-4" />
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Rechercher une dépense…"
        className="w-full rounded-md border border-line bg-bg-elev py-2 pl-8 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-accent-d"
      />
    </div>

    <div className="ml-auto flex items-center gap-2.5">
      <ExportButton />
    </div>
  </div>
);

export default SpendingToolbar;
