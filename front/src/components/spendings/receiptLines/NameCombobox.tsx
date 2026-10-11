import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { cn } from "@lib/utils";
import { Check } from "lucide-react";
import { useState } from "react";

import type { NameComboboxText, NameOption } from "@components/spendings/interfaces/receiptLinesTypes";
import type { ReactNode } from "react";

interface NameComboboxProps {
  options: NameOption[];
  /** The option currently picked, null for a name typed by hand. */
  selectedID: string | null;
  /** What the trigger shows: the picked or typed name. */
  value: string | null;
  icon: ReactNode;
  text: NameComboboxText;
  maxLength: number;
  testId: string;
  onPick: (option: NameOption | null) => void;
  onType: (name: string) => void;
}

/**
 * A known name to pick, or a new one to type (PFA-218, PFA-219): the store of
 * a receipt, the product type of a line. Closing with a typed name keeps it.
 */
const NameCombobox = ({
  options,
  selectedID,
  value,
  icon,
  text,
  maxLength,
  testId,
  onPick,
  onType,
}: NameComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const typed = query.trim();
  const exactMatch = options.find((option) => option.name.toLowerCase() === typed.toLowerCase() && !option.hint);

  const close = () => {
    setQuery("");
    setOpen(false);
  };
  const pick = (option: NameOption | null) => {
    onPick(option);
    close();
  };
  const type = (name: string) => {
    onType(name);
    close();
  };

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && typed) {
          if (exactMatch) pick(exactMatch);
          else type(typed);
          return;
        }
        setOpen(isOpen);
      }}
      modal
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid={testId}
          role="combobox"
          aria-expanded={open}
          aria-label={text.label}
          className={cn(
            "flex h-9.5 w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-md border bg-surface-base px-3 text-left text-sm text-ink transition-colors hover:border-ink-4 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-ink-4",
            open ? "border-accent-d" : "border-line",
          )}
        >
          {icon}
          <span className={cn("min-w-0 flex-1 truncate", !value && "text-ink-4")}>{value ?? text.placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-60 border-line bg-surface-elev p-0"
        align="start"
      >
        <Command className="bg-transparent">
          <CommandInput
            placeholder={text.search}
            value={query}
            onValueChange={setQuery}
            maxLength={maxLength}
            className="text-ink"
          />
          <CommandList>
            <CommandEmpty>{text.empty}</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value="__none"
                  onSelect={() => pick(null)}
                >
                  <span className="text-ink-4">{text.clear}</span>
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.ID}
                  // The hint is searched too: "Express" finds both shops, "Port" the one on the port.
                  value={`${option.name} ${option.hint ?? ""} ${option.ID}`}
                  onSelect={() => pick(option)}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{option.name}</span>
                    {option.hint && <span className="truncate text-xs text-ink-4">{option.hint}</span>}
                  </span>
                  {option.ID === selectedID && <Check className="size-4 shrink-0 text-accent-strong" />}
                </CommandItem>
              ))}
              {typed && !exactMatch && (
                <CommandItem
                  value={`__new-${typed}`}
                  onSelect={() => type(typed)}
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

export default NameCombobox;
