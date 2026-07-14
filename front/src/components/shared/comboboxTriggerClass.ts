import { cn } from "@lib/utils";

/**
 * Shared className for the category combobox trigger button, identical between the
 * spending modal and the exceptionnels modal. `open` swaps the border accent.
 */
export const comboboxTriggerClass = (open: boolean) =>
  cn(
    "flex w-full items-center gap-2.5 rounded-md border bg-background px-3 py-2.5 text-left text-sm text-ink transition-colors hover:border-ink-4",
    open ? "border-accent-d" : "border-line",
  );
