import useStores from "@components/spendings/services/useStores";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { FIELD_LIMITS } from "@src/schemas/fieldLimits";
import { Check, Store } from "lucide-react";
import { useState } from "react";

interface StorePickerProps {
  value: string | null;
  onChange: (store: string | null) => void;
}

/**
 * The store of a receipt (PFA-218): prefilled from the OCR, one of the user's
 * stores or a new name typed in. Closing with a typed name keeps it, like the
 * category combobox.
 */
const StorePicker = ({ value, onChange }: StorePickerProps) => {
  const { receiptLines: t } = useTranslations("spendings");
  const { data: stores = [] } = useStores();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const typed = query.trim();
  const exactMatch = stores.find((store) => store.name.toLowerCase() === typed.toLowerCase());

  const pick = (store: string | null) => {
    onChange(store);
    setQuery("");
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && typed) {
          pick(exactMatch?.name ?? typed);
          return;
        }
        setOpen(isOpen);
      }}
      modal
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid="receipt-store"
          role="combobox"
          aria-expanded={open}
          aria-label={t.store}
          className={cn(
            "flex h-9.5 w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-md border bg-surface-base px-3 text-left text-sm text-ink transition-colors hover:border-ink-4",
            open ? "border-accent-d" : "border-line",
          )}
        >
          <Store className="size-4 shrink-0 text-ink-4" />
          <span className={cn("min-w-0 flex-1 truncate", !value && "text-ink-4")}>{value ?? t.storePlaceholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) border-line bg-surface-elev p-0"
        align="start"
      >
        <Command className="bg-transparent">
          <CommandInput
            placeholder={t.storeSearch}
            value={query}
            onValueChange={setQuery}
            maxLength={FIELD_LIMITS.storeName}
            className="text-ink"
          />
          <CommandList>
            <CommandEmpty>{t.storeEmpty}</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value="__none"
                  onSelect={() => pick(null)}
                >
                  <span className="text-ink-4">{t.storeClear}</span>
                </CommandItem>
              )}
              {stores.map((store) => (
                <CommandItem
                  key={store.ID}
                  value={store.name}
                  onSelect={() => pick(store.name)}
                >
                  <span className="flex-1">{store.name}</span>
                  {store.name === value && <Check className="size-4 text-accent-strong" />}
                </CommandItem>
              ))}
              {typed && !exactMatch && (
                <CommandItem
                  value={`__new-${typed}`}
                  onSelect={() => pick(typed)}
                >
                  <span className="flex-1">{typed}</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default StorePicker;
