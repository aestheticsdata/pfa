import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  FieldShell,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "pfa-next";
import { Check, ChevronsUpDown } from "lucide-react";

/** Category colours come from the API as hex — the one data-driven colour in the app. */
const CATEGORIES = [
  { name: "Alimentation", color: "#4ade80" },
  { name: "Transport", color: "#60a5fa" },
  { name: "Loyer", color: "#f472b6" },
  { name: "Courses", color: "#fbbf24" },
  { name: "Pharmacie", color: "#a78bfa" },
  { name: "Abonnement Netflix", color: "#fb7185" },
];

const Swatch = ({ color }: { color: string }) => (
  <span
    className="mr-1 size-2.5 shrink-0 rounded-xs"
    style={{ backgroundColor: color }}
  />
);

/**
 * The category combobox of the spending modal: a Popover holding the Command,
 * open on "Alimentation". Search-or-type — closing commits whatever was typed.
 */
export const CategoryCombobox = () => (
  <FieldShell
    label="Catégorie"
    className="w-72"
  >
    <Popover defaultOpen>
      <PopoverTrigger asChild>
        {/* the app's trigger is a raw button — comboboxTriggerClass(open: true) */}
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-md border border-accent-d bg-background px-3 py-2.5 text-left text-sm text-ink transition-colors"
        >
          <span
            className="size-2.5 shrink-0 rounded-xs"
            style={{ backgroundColor: "#4ade80" }}
          />
          <span className="capitalize">Alimentation</span>
          <ChevronsUpDown className="ml-auto size-4 shrink-0 text-ink-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] border-line bg-surface-elev p-0"
        align="start"
      >
        <Command
          className="bg-transparent"
          value="Alimentation"
        >
          <CommandInput placeholder="Rechercher ou saisir…" />
          <CommandList>
            <CommandEmpty>Aucune catégorie.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="__none">
                <span className="text-ink-4">Aucune catégorie</span>
              </CommandItem>
              {CATEGORIES.map((c) => (
                <CommandItem
                  key={c.name}
                  value={c.name}
                >
                  <Swatch color={c.color} />
                  <span className="flex-1 capitalize">{c.name}</span>
                  {c.name === "Alimentation" && <Check className="size-4 text-accent-strong" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  </FieldShell>
);

/** Group headings + a separator: quick-picks above the full category list. */
export const Grouped = () => (
  <Command
    className="w-72 rounded-md border border-line"
    value="Transport"
  >
    <CommandInput placeholder="Rechercher ou saisir…" />
    <CommandList>
      <CommandEmpty>Aucune catégorie.</CommandEmpty>
      <CommandGroup heading="Fréquentes">
        {CATEGORIES.slice(0, 3).map((c) => (
          <CommandItem
            key={c.name}
            value={c.name}
          >
            <Swatch color={c.color} />
            <span className="flex-1 capitalize">{c.name}</span>
          </CommandItem>
        ))}
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Toutes les catégories">
        {CATEGORIES.slice(3).map((c) => (
          <CommandItem
            key={c.name}
            value={c.name}
          >
            <Swatch color={c.color} />
            <span className="flex-1 capitalize">{c.name}</span>
          </CommandItem>
        ))}
      </CommandGroup>
    </CommandList>
  </Command>
);

/**
 * A query with no exact match: the typed value is offered as a plain option
 * (grey swatch) — selecting it, or just closing, creates the category.
 */
export const SearchAndCreate = () => (
  <Command
    className="w-72 rounded-md border border-line"
    shouldFilter={false}
    value="__new-Pharmacie du centre"
  >
    <CommandInput
      placeholder="Rechercher ou saisir…"
      value="Pharmacie du centre"
    />
    <CommandList>
      <CommandEmpty>Aucune catégorie.</CommandEmpty>
      <CommandGroup>
        <CommandItem value="Pharmacie">
          <Swatch color="#a78bfa" />
          <span className="flex-1 capitalize">Pharmacie</span>
        </CommandItem>
        <CommandItem value="__new-Pharmacie du centre">
          <span className="mr-1 size-2.5 shrink-0 rounded-xs bg-ink-4" />
          <span className="flex-1 capitalize">Pharmacie du centre</span>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
);

/** No result at all — `CommandEmpty` takes over the list. */
export const Empty = () => (
  <Command
    className="w-72 rounded-md border border-line"
    shouldFilter={false}
  >
    <CommandInput
      placeholder="Rechercher ou saisir…"
      value="Assurance vie"
    />
    <CommandList>
      <CommandEmpty>Aucune catégorie.</CommandEmpty>
    </CommandList>
  </Command>
);
