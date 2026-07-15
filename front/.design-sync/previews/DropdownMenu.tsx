import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "pfa-next";
import { ChevronDown, Copy, FileSpreadsheet, FileText, KeyRound, LogOut, Pencil, Trash2 } from "lucide-react";

/** The avatar + email + chevron trigger of the navbar user menu, verbatim from `UserMenu`. */
const AccountTrigger = () => (
  <DropdownMenuTrigger className="group flex cursor-pointer items-center gap-2.5 rounded-md outline-hidden">
    <span className="grid size-[30px] flex-shrink-0 place-items-center rounded-full border border-line bg-surface-hi text-2xs font-medium text-ink-2">
      CM
    </span>
    <span className="max-w-[200px] truncate text-sm text-ink-2">camille.morel@gmail.com</span>
    <ChevronDown className="size-4 flex-shrink-0 text-ink-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
  </DropdownMenuTrigger>
);

/** A compact row-action trigger, as the spendings table uses. */
const RowTrigger = ({ label }: { label: string }) => (
  <DropdownMenuTrigger className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-line bg-surface-elev px-2.5 py-2 text-sm text-ink-2 outline-hidden transition-colors hover:border-ink-4">
    {label}
    <ChevronDown className="size-3 text-ink-4" />
  </DropdownMenuTrigger>
);

/**
 * The canonical story: the navbar account menu — the app's only DropdownMenu.
 * `defaultOpen` so the portalled content renders; `align="end"` hangs it under
 * the avatar the way the real navbar does.
 */
export const UserMenu = () => (
  <DropdownMenu defaultOpen>
    <AccountTrigger />
    <DropdownMenuContent
      align="end"
      sideOffset={12}
      className="w-64 p-1"
    >
      <DropdownMenuItem className="cursor-pointer gap-3 px-3 py-2.5 text-sm text-ink-2">
        <KeyRound className="size-4 text-accent-strong" />
        Modifier le mot de passe
      </DropdownMenuItem>
      <DropdownMenuSeparator className="my-1" />
      <DropdownMenuItem className="cursor-pointer gap-3 px-3 py-2.5 text-sm text-ink-2">
        <LogOut className="size-4 text-ink-3" />
        Se déconnecter
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

/**
 * `DropdownMenuItem`'s variant axis — `default` vs `destructive` (the red delete
 * affordance) — plus the `disabled` state, and the `Label` / `Group` /
 * `Separator` / `Shortcut` sub-parts that have no card of their own.
 */
export const ItemVariants = () => (
  <DropdownMenu defaultOpen>
    <RowTrigger label="Courses — 41,35 €" />
    <DropdownMenuContent
      align="start"
      className="w-64"
    >
      <DropdownMenuLabel className="text-ink-3">Dépense du 12 mai 2026</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <Pencil />
          Modifier
          <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy />
          Dupliquer
          <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <FileText />
          Voir le justificatif
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive">
        <Trash2 />
        Supprimer
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

/** `DropdownMenuCheckboxItem` — multi-select toggles with the check indicator in the left gutter. */
export const CheckboxItems = () => (
  <DropdownMenu defaultOpen>
    <RowTrigger label="Afficher" />
    <DropdownMenuContent
      align="start"
      className="w-64"
    >
      <DropdownMenuLabel className="text-ink-3">Lignes affichées</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem checked>Dépenses fixes</DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem checked>Achats exceptionnels</DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem>Catégories archivées</DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

/** `DropdownMenuRadioGroup` / `DropdownMenuRadioItem` — one-of-N, dot indicator on the current value. */
export const RadioItems = () => (
  <DropdownMenu defaultOpen>
    <RowTrigger label="Trier par" />
    <DropdownMenuContent
      align="start"
      className="w-64"
    >
      <DropdownMenuLabel className="text-ink-3">Trier les dépenses</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup value="date">
        <DropdownMenuRadioItem value="date">Date — récent → ancien</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="amount">Montant décroissant</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="category">Catégorie (A → Z)</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);

/**
 * `DropdownMenuSub` — both levels pinned open so the sub-trigger's open state and
 * `SubContent` render.
 *
 * The sub is *controlled* (`open`), not `defaultOpen`, and that is load-bearing:
 * Radix's `MenuSub` runs `useEffect(… , return () => handleOpenChange(false))`, so
 * the effect's cleanup force-closes the sub and nothing ever reopens it — an
 * uncontrolled `defaultOpen` sub renders its trigger but never its `SubContent`.
 * Controlled `open` ignores that close and is the only way to pin a submenu for a
 * static capture.
 */
export const Submenu = () => (
  <DropdownMenu defaultOpen>
    <RowTrigger label="Mai 2026" />
    <DropdownMenuContent
      align="start"
      className="w-56"
    >
      <DropdownMenuItem>
        <Pencil />
        Renommer la période
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuSub open>
        <DropdownMenuSubTrigger>
          <FileSpreadsheet className="mr-2 size-4 text-ink-4" />
          Exporter
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-44">
          <DropdownMenuItem>Format CSV</DropdownMenuItem>
          <DropdownMenuItem>Format PDF</DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenuContent>
  </DropdownMenu>
);
