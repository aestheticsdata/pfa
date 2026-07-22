"use client";

import SpendingSearchModal from "@components/spendings/search/SpendingSearchModal";
import { spendingSearchParsers, spendingSearchUrlOptions } from "@components/spendings/search/searchParams";
import useTranslations from "@i18n/useTranslations";
import { Search } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useEffect } from "react";

/**
 * Whole-history spending search entry point (COS-114/COS-118), rendered in the
 * Spendings toolbar next to the week filter. Opening writes the modal's open flag
 * to the URL (a pushed history entry) so browser Back can restore it; the modal
 * itself reads that state. Two presentations of the same click target: a compact
 * labelled button with a ⌘K hint on desktop (md+), and a full-width field styled
 * like the week filter on mobile — so it reads as a search field, not a stray
 * icon. ⌘K / Ctrl+K is an optional desktop shortcut.
 */
const SpendingSearchTrigger = () => {
  const spendingSearch = useTranslations("spendingSearch");
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

      <button
        type="button"
        onClick={openSearch}
        className="relative flex w-full items-center rounded-md border border-line bg-surface-elev py-2 pl-8 pr-3 text-left text-sm text-ink-4 transition-colors hover:text-ink md:hidden"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-4" />
        {spendingSearch.trigger}
      </button>

      <SpendingSearchModal />
    </>
  );
};

export default SpendingSearchTrigger;
