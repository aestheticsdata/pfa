import { comboboxTriggerClass } from "@components/shared/comboboxTriggerClass";
import { FieldShell } from "@components/shared/FieldShell";
import { Overline } from "@components/shared/Overline";
import { FALLBACK_COLOR, getRandomHexColor } from "@components/spendings/common/spendingModal/helpers";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { cn } from "@lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

import type { CategoryOption } from "@components/spendings/common/spendingModal/schema";
import type { Dispatch, SetStateAction } from "react";

interface CategoryFieldProps {
  categoryOptions: CategoryOption[];
  selectedCategory: CategoryOption | null;
  setSelectedCategory: Dispatch<SetStateAction<CategoryOption | null>>;
  comboboxOpen: boolean;
  setComboboxOpen: Dispatch<SetStateAction<boolean>>;
  comboboxQuery: string;
  setComboboxQuery: Dispatch<SetStateAction<string>>;
  userId: string | null;
}

const CategoryField = ({
  categoryOptions,
  selectedCategory,
  setSelectedCategory,
  comboboxOpen,
  setComboboxOpen,
  comboboxQuery,
  setComboboxQuery,
  userId,
}: CategoryFieldProps) => {
  // MOCK — "Fréquentes" quick-picks: the SELECTION is real, but the ranking
  // (first N categories) stands in for real per-category usage counts.
  // De-mock tracked in COS-22.
  const frequentCategories = categoryOptions.filter((c) => c.name).slice(0, 6);

  const exactMatch = categoryOptions.find((c) => c.name.toLowerCase() === comboboxQuery.trim().toLowerCase());

  const onCreateCategory = (name: string) => {
    const newCategory: CategoryOption = {
      ID: null,
      userID: userId,
      name,
      color: getRandomHexColor(),
    };
    setSelectedCategory(newCategory);
    setComboboxOpen(false);
    setComboboxQuery("");
  };

  return (
    <FieldShell label="Catégorie">
      <Popover
        open={comboboxOpen}
        onOpenChange={(isOpen) => {
          // On close (click-away / Escape), commit whatever was typed as
          // the category — matching existing, else a new one — so the
          // user never has to click a "create" action.
          if (!isOpen) {
            const q = comboboxQuery.trim();
            if (q) {
              const match = categoryOptions.find((c) => c.name.toLowerCase() === q.toLowerCase());
              setSelectedCategory(
                match ?? {
                  ID: null,
                  userID: userId,
                  name: q,
                  color: getRandomHexColor(),
                },
              );
              setComboboxQuery("");
            }
          }
          setComboboxOpen(isOpen);
        }}
        modal
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={comboboxOpen}
            onKeyDown={(e) => {
              if (!comboboxOpen && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                setComboboxQuery(e.key);
                setComboboxOpen(true);
              }
            }}
            className={comboboxTriggerClass(comboboxOpen)}
          >
            {selectedCategory?.name ? (
              <>
                <span
                  className="size-2.5 shrink-0 rounded-xs"
                  style={{
                    backgroundColor: selectedCategory.color ?? FALLBACK_COLOR,
                  }}
                />
                <span className="capitalize">{selectedCategory.name}</span>
              </>
            ) : (
              <span className="text-ink-4">Aucune</span>
            )}
            <ChevronsUpDown className="ml-auto size-4 shrink-0 text-ink-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] border-line bg-surface-elev p-0"
          align="start"
        >
          <Command className="bg-transparent">
            <CommandInput
              placeholder="Rechercher ou saisir…"
              value={comboboxQuery}
              onValueChange={setComboboxQuery}
              className="text-ink"
            />
            <CommandList>
              <CommandEmpty>Aucune catégorie.</CommandEmpty>
              <CommandGroup>
                {selectedCategory && (
                  <CommandItem
                    value="__none"
                    onSelect={() => {
                      setSelectedCategory(null);
                      setComboboxQuery("");
                      setComboboxOpen(false);
                    }}
                  >
                    <span className="text-ink-4">Aucune catégorie</span>
                  </CommandItem>
                )}
                {categoryOptions.map((category) => (
                  <CommandItem
                    key={category.ID ?? category.name}
                    value={category.name}
                    onSelect={() => {
                      setSelectedCategory(category);
                      setComboboxQuery("");
                      setComboboxOpen(false);
                    }}
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
                {comboboxQuery.trim() && !exactMatch && (
                  // The typed value shown as a normal option — selecting
                  // it (or just closing) uses it; it's persisted when the
                  // spending is created. No explicit "create" step.
                  <CommandItem
                    value={`__new-${comboboxQuery.trim()}`}
                    onSelect={() => onCreateCategory(comboboxQuery.trim())}
                  >
                    <span className="mr-1 size-2.5 rounded-xs bg-ink-4" />
                    <span className="flex-1 capitalize">{comboboxQuery.trim()}</span>
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {frequentCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Overline className="mr-1">Fréquentes</Overline>
          {frequentCategories.map((c) => {
            const active = selectedCategory?.name === c.name;
            return (
              <button
                key={c.ID ?? c.name}
                type="button"
                onClick={() => setSelectedCategory(c)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs capitalize transition-colors",
                  active
                    ? "border-accent-d bg-accent-strong/10 text-ink"
                    : "border-line bg-surface-hi text-ink-2 hover:text-ink",
                )}
              >
                <span
                  className="size-2 shrink-0 rounded-xs"
                  style={{ backgroundColor: c.color ?? FALLBACK_COLOR }}
                />
                {c.name}
              </button>
            );
          })}
        </div>
      )}
    </FieldShell>
  );
};

export default CategoryField;
