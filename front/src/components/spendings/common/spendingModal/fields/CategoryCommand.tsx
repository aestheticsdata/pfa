import { FALLBACK_COLOR } from "@components/spendings/common/spendingModal/helpers";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@components/ui/command";
import useTranslations from "@i18n/useTranslations";
import { FIELD_LIMITS } from "@src/schemas/fieldLimits";
import { Check } from "lucide-react";

import type { CategoryOption } from "@components/spendings/common/spendingModal/schema";

interface CategoryCommandProps {
  categoryOptions: CategoryOption[];
  selectedCategory: CategoryOption | null;
  query: string;
  onQueryChange: (query: string) => void;
  /** An option, the typed name as a new category, or null for "no category". */
  onPick: (category: CategoryOption | null) => void;
  onCreate: (name: string) => void;
}

/**
 * The searchable category list of the spending modal — shared by the single
 * spending's category field and each line of a group (PFA-189).
 */
const CategoryCommand = ({
  categoryOptions,
  selectedCategory,
  query,
  onQueryChange,
  onPick,
  onCreate,
}: CategoryCommandProps) => {
  const spendings = useTranslations("spendings");
  const { modal: t } = spendings;

  const exactMatch = categoryOptions.find((c) => c.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <Command className="bg-transparent">
      <CommandInput
        data-testid="spending-category-search"
        placeholder={t.category.searchPlaceholder}
        value={query}
        onValueChange={onQueryChange}
        // Whatever is typed is committed as a category name — on selection
        // or simply on close — and this combobox has no error slot, so the
        // bound is enforced at the keystroke rather than reported after the
        // fact (COS-180).
        maxLength={FIELD_LIMITS.categoryName}
        className="text-ink"
      />
      <CommandList>
        <CommandEmpty>{t.category.commandEmpty}</CommandEmpty>
        <CommandGroup>
          {selectedCategory && (
            <CommandItem
              value="__none"
              onSelect={() => onPick(null)}
            >
              <span className="text-ink-4">{t.category.clearOption}</span>
            </CommandItem>
          )}
          {categoryOptions.map((category) => (
            <CommandItem
              key={category.ID ?? category.name}
              data-testid="spending-category-option"
              data-category={category.name}
              value={category.name}
              onSelect={() => onPick(category)}
            >
              <span
                className="mr-1 size-2.5 rounded-xs"
                style={{
                  backgroundColor: category.color ?? FALLBACK_COLOR,
                }}
              />
              <span className="flex-1 capitalize">{category.name}</span>
              {selectedCategory?.ID === category.ID && <Check className="size-4 text-accent-strong" />}
            </CommandItem>
          ))}
          {query.trim() && !exactMatch && (
            // The typed value shown as a normal option — selecting
            // it (or just closing) uses it; it's persisted when the
            // spending is created. No explicit "create" step.
            <CommandItem
              value={`__new-${query.trim()}`}
              onSelect={() => onCreate(query.trim())}
            >
              <span className="mr-1 size-2.5 rounded-xs bg-ink-4" />
              <span className="flex-1 capitalize">{query.trim()}</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

export default CategoryCommand;
