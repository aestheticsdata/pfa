import CategoryCommand from "@components/spendings/common/spendingModal/fields/CategoryCommand";
import { FALLBACK_COLOR, getRandomHexColor } from "@components/spendings/common/spendingModal/helpers";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import type { CategoryOption } from "@components/spendings/common/spendingModal/schema";

interface LineCategoryPickerProps {
  categoryOptions: CategoryOption[];
  category: CategoryOption | null;
  onChange: (category: CategoryOption | null) => void;
}

/**
 * Compact category combobox of a group line (PFA-189): the modal's category
 * list behind a small swatch + name trigger. Typing a new name creates it on
 * submit, as in the single field.
 */
const LineCategoryPicker = ({ categoryOptions, category, onChange }: LineCategoryPickerProps) => {
  const { modal: t } = useTranslations("spendings");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const pick = (next: CategoryOption | null) => {
    onChange(next);
    setQuery("");
    setOpen(false);
  };

  const create = (name: string) => pick({ ID: null, userID: null, name, color: getRandomHexColor() });

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        // Closing commits a typed name, like the single category field.
        const q = query.trim();
        if (!isOpen && q) {
          const match = categoryOptions.find((c) => c.name.toLowerCase() === q.toLowerCase());
          if (match) pick(match);
          else create(q);
          return;
        }
        setOpen(isOpen);
      }}
      modal
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid="group-line-category"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-9.5 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md border bg-surface-base px-2.5 text-left text-sm text-ink transition-colors hover:border-ink-4",
            open ? "border-accent-d" : "border-line",
          )}
        >
          <span
            className="size-2.25 shrink-0 rounded-xs"
            style={{ backgroundColor: category?.color ?? FALLBACK_COLOR }}
          />
          <span className={cn("min-w-0 flex-1 truncate capitalize", !category && "text-ink-4")}>
            {category?.name ?? t.category.triggerEmpty}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-ink-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 border-line bg-surface-elev p-0"
        align="start"
      >
        <CategoryCommand
          categoryOptions={categoryOptions}
          selectedCategory={category}
          query={query}
          onQueryChange={setQuery}
          onPick={pick}
          onCreate={create}
        />
      </PopoverContent>
    </Popover>
  );
};

export default LineCategoryPicker;
