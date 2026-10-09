import { comboboxTriggerClass } from "@components/shared/comboboxTriggerClass";
import { FieldShell } from "@components/shared/FieldShell";
import { Overline } from "@components/shared/Overline";
import CategoryCommand from "@components/spendings/common/spendingModal/fields/CategoryCommand";
import { FALLBACK_COLOR, getRandomHexColor } from "@components/spendings/common/spendingModal/helpers";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { ChevronsUpDown } from "lucide-react";

import type { CategoryOption } from "@components/spendings/common/spendingModal/schema";
import type { Dispatch, SetStateAction } from "react";

interface CategoryFieldProps {
  categoryOptions: CategoryOption[];
  frequentCategories: CategoryOption[];
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
  frequentCategories,
  selectedCategory,
  setSelectedCategory,
  comboboxOpen,
  setComboboxOpen,
  comboboxQuery,
  setComboboxQuery,
  userId,
}: CategoryFieldProps) => {
  const spendings = useTranslations("spendings");
  const { modal: t } = spendings;

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
    <FieldShell label={t.fields.category}>
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
            data-testid="spending-category"
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
              <span className="text-ink-4">{t.category.triggerEmpty}</span>
            )}
            <ChevronsUpDown className="ml-auto size-4 shrink-0 text-ink-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] border-line bg-surface-elev p-0"
          align="start"
        >
          <CategoryCommand
            categoryOptions={categoryOptions}
            selectedCategory={selectedCategory}
            query={comboboxQuery}
            onQueryChange={setComboboxQuery}
            onPick={(category) => {
              setSelectedCategory(category);
              setComboboxQuery("");
              setComboboxOpen(false);
            }}
            onCreate={onCreateCategory}
          />
        </PopoverContent>
      </Popover>

      {frequentCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Overline className="mr-1">{t.category.frequent}</Overline>
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
