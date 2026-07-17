"use client";

import { IconButton } from "@components/shared/IconButton";
import SpendingSearchModal from "@components/spendings/search/SpendingSearchModal";
import { spendingSearchParsers, spendingSearchUrlOptions } from "@components/spendings/search/searchParams";
import spendingSearch from "@text/spendingSearch";
import { Search } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useEffect } from "react";

/**
 * Dashboard entry point for the whole-history spending search (COS-114). Rendered
 * in the NavBar right cluster, gated by `isDashboard`. Opening writes the modal's
 * open flag to the URL (a pushed history entry) so browser Back can restore it;
 * the modal itself reads that state. Primary access is the click target (field on
 * desktop, magnifier on mobile); ⌘K / Ctrl+K is an optional desktop shortcut.
 */
const SpendingSearchTrigger = () => {
  const [, setSearchState] = useQueryStates(spendingSearchParsers, spendingSearchUrlOptions);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchState({ search: true }, { history: "push" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setSearchState]);

  const openSearch = () => setSearchState({ search: true }, { history: "push" });

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        className="hidden items-center gap-2 rounded-sm border border-line bg-surface-elev px-2.5 py-2 text-sm text-ink-3 transition-colors hover:text-ink md:flex"
      >
        <Search className="size-3.5 text-ink-4" />
        <span>{spendingSearch.trigger}</span>
        <kbd className="ml-1 rounded-sm border border-line px-1 py-0.5 text-[11px] leading-none text-ink-4">
          {spendingSearch.shortcutHint}
        </kbd>
      </button>

      <IconButton
        variant="bordered"
        size={9}
        onClick={openSearch}
        aria-label={spendingSearch.trigger}
        className="md:hidden"
      >
        <Search />
      </IconButton>

      <SpendingSearchModal />
    </>
  );
};

export default SpendingSearchTrigger;
