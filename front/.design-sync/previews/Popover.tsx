import { Input, Popover, PopoverContent, PopoverTrigger } from "pfa-next";
import { Calendar, Check, ChevronDown, Plus, Search } from "lucide-react";

/** The popover chrome the Statistiques filter bar puts on every `PopoverContent`. */
const POP_CONTENT = "rounded-lg border border-line bg-surface-elev p-1.5 shadow-popover";

const CATEGORIES = [
  { name: "Alimentation", color: "#5ec8a0" },
  { name: "Transport", color: "#6aa9f0" },
  { name: "Loyer", color: "#c58af0" },
  { name: "Courses", color: "#f0b45e" },
  { name: "Pharmacie", color: "#ef7d7d" },
  { name: "Abonnement Netflix", color: "#8c93f5" },
];

/**
 * The canonical story: the period picker of the Statistiques filter bar. The
 * trigger carries the selected year, the content lists the years with the
 * current one in the accent tone plus a check. `defaultOpen` renders the portal.
 */
export const PeriodPicker = () => (
  <Popover defaultOpen>
    <PopoverTrigger asChild>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-sm border border-line bg-surface-elev px-2.5 py-2 text-sm text-ink-2 transition-colors hover:border-ink-4"
      >
        <Calendar className="size-3.5 text-ink-4" />
        <span className="num text-ink">2026</span>
        <ChevronDown className="size-3 text-ink-4" />
      </button>
    </PopoverTrigger>
    <PopoverContent
      align="start"
      className={`${POP_CONTENT} w-[132px]`}
    >
      <div className="flex max-h-[264px] flex-col overflow-y-auto">
        {[2026, 2025, 2024, 2023, 2022].map((year) => (
          <button
            key={year}
            type="button"
            className={`num flex items-center justify-between rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface-hi ${
              year === 2026 ? "text-accent-strong" : "text-ink-2"
            }`}
          >
            {year}
            {year === 2026 && <Check className="size-3.5" />}
          </button>
        ))}
      </div>
    </PopoverContent>
  </Popover>
);

/**
 * The wider composition: the category picker — a search `Input` above a scrolling
 * list of colour-dotted categories, with the already-picked one checked.
 */
export const CategoryPicker = () => (
  <Popover defaultOpen>
    <PopoverTrigger asChild>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface-elev py-2 pl-2.5 pr-3 text-sm text-ink-2 transition-colors hover:border-ink-4"
      >
        <Plus className="size-3" />
        Ajouter une catégorie
      </button>
    </PopoverTrigger>
    <PopoverContent
      align="start"
      className={`${POP_CONTENT} w-72`}
    >
      <div className="relative mb-1.5">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-4" />
        <Input
          defaultValue=""
          placeholder="Rechercher…"
          className="h-9 border-line bg-background pl-8 text-sm"
        />
      </div>
      <div className="max-h-[264px] overflow-y-auto pr-0.5">
        {CATEGORIES.map((category) => (
          <button
            key={category.name}
            type="button"
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm capitalize text-ink-2 transition-colors hover:bg-surface-hi hover:text-ink"
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: category.color }}
            />
            <span className="flex-1 truncate">{category.name}</span>
            {category.name === "Alimentation" && <Check className="size-3.5 text-accent-strong" />}
          </button>
        ))}
      </div>
    </PopoverContent>
  </Popover>
);

/** The empty state — a query that matches no category. */
export const EmptyResults = () => (
  <Popover defaultOpen>
    <PopoverTrigger asChild>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface-elev py-2 pl-2.5 pr-3 text-sm text-ink-2 transition-colors hover:border-ink-4"
      >
        <Plus className="size-3" />
        Ajouter une catégorie
      </button>
    </PopoverTrigger>
    <PopoverContent
      align="start"
      className={`${POP_CONTENT} w-72`}
    >
      <div className="relative mb-1.5">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-4" />
        <Input
          defaultValue="assurance"
          className="h-9 border-line bg-background pl-8 text-sm"
        />
      </div>
      <div className="px-2.5 py-3 text-center text-xs text-ink-4">Aucune catégorie</div>
    </PopoverContent>
  </Popover>
);
