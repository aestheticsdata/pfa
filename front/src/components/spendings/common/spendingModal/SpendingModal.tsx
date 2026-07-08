"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Mexp from "math-expression-evaluator";
import subMonths from "date-fns/subMonths";
import addDays from "date-fns/addDays";
import addMonths from "date-fns/addMonths";
import startOfMonth from "date-fns/startOfMonth";
import endOfMonth from "date-fns/endOfMonth";
import parseISO from "date-fns/parseISO";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Copy,
  Upload,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Button } from "@components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@components/ui/command";
import { cn } from "@lib/utils";
import useCategories from "@components/spendings/services/useCategories";
import { useAuth } from "@auth/context/AuthContext";
import useSpendings from "@components/spendings/services/useSpendings";
import useReccurings from "@components/spendings/services/useReccurings";
import { DATE_FORMAT } from "@components/spendings/config/constants";
import { mockLabelSuggestions } from "@components/spendings/common/spendingModal/mockSuggestions";
import { SpendingCategoryInputSchema } from "@src/schemas/spendings";

import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";
import type {
  SpendingItem,
  SpendingListItem,
} from "@components/spendings/types";

const spendingSchema = z.object({
  spendingLabel: z.string().min(1, "Label requis"),
  spendingAmount: z.string().min(1, "Montant requis"),
  spendingDate: z.string().optional(),
  categoryName: z.string().optional(),
});

type SpendingForm = z.infer<typeof spendingSchema>;
type CategoryOption = z.infer<typeof SpendingCategoryInputSchema>;

const FALLBACK_COLOR = "#94a3b8";

const humanSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1_048_576) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1_048_576).toFixed(1)} Mo`;
};

interface SpendingModalProps {
  date?: Date;
  closeModal: () => void;
  spending: SpendingListItem | null;
  recurringType?: boolean;
  isEditing: boolean;
  month?: MonthRange | null;
}

const getRandomHexColor = () => {
  const r = Math.floor(Math.random() * 255)
    .toString(16)
    .padStart(2, "0");
  const g = Math.floor(Math.random() * 255)
    .toString(16)
    .padStart(2, "0");
  const b = Math.floor(Math.random() * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${r}${g}${b}`;
};

const Toggle = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "inline-flex select-none items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors",
      active
        ? "border-accent-d bg-accent-strong/10 text-ink"
        : "border-line bg-background text-ink-3 hover:text-ink-2",
    )}
  >
    <span
      className={cn(
        "grid size-3.5 place-items-center rounded-[3px] border",
        active
          ? "border-accent-strong bg-accent-strong text-[oklch(0.15_0.02_180)]"
          : "border-line bg-bg-hi",
      )}
    >
      {active && <Check className="size-2.5" strokeWidth={3} />}
    </span>
    {children}
  </button>
);

const SpendingModal = ({
  date,
  closeModal: closeModalProp,
  spending,
  recurringType = false,
  isEditing,
  month = null,
}: SpendingModalProps) => {
  const [open, setOpen] = useState(true);
  const closeModal = () => {
    setOpen(false);
    setTimeout(closeModalProp, 200);
  };
  const { user } = useAuth();
  const { createSpending, updateSpending } = useSpendings();
  const { recurrings, createRecurring, updateRecurring, copyRecurrings } =
    useReccurings();
  const { categories, error: categoriesError } = useCategories();
  if (categoriesError) {
    throw categoriesError;
  }

  const categoryOptions: CategoryOption[] = useMemo(
    () =>
      (categories ?? []).map((c) => ({
        ID: c.ID,
        userID: c.userID,
        name: c.name,
        color: c.color,
      })),
    [categories],
  );

  // MOCK — "Fréquentes" quick-picks: the SELECTION is real, but the ranking
  // (first N categories) stands in for real per-category usage counts.
  const frequentCategories = useMemo(
    () => categoryOptions.filter((c) => c.name).slice(0, 6),
    [categoryOptions],
  );

  const isSpendingItem = (v: SpendingListItem | null): v is SpendingItem =>
    !!v && "date" in v;

  const initialCategory: CategoryOption | null =
    isSpendingItem(spending) && spending.category
      ? {
          ID: spending.categoryID ?? null,
          userID: user?.id ?? null,
          name: spending.category ?? "",
          color: spending.categoryColor ?? null,
        }
      : null;

  const [selectedCategory, setSelectedCategory] = useState<CategoryOption | null>(
    initialCategory,
  );
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [comboboxQuery, setComboboxQuery] = useState("");
  const [labelQuery, setLabelQuery] = useState(spending?.label ?? "");
  // "Récurrente mensuelle" toggle — only offered when creating a plain spending
  // from the timeline (never in edit mode, never when already a recurring).
  const [isRecurringToggle, setIsRecurringToggle] = useState(false);
  const asRecurring = recurringType || isRecurringToggle;
  const canToggleRecurring = !isEditing && !recurringType;

  // Month a new recurring belongs to (its start/end window). Defaults to the
  // viewed month; the user can step it in the modal.
  const [recurringMonth, setRecurringMonth] = useState<Date>(() =>
    month?.start ? startOfMonth(month.start) : startOfMonth(new Date()),
  );

  // MOCK — receipt-at-creation is visual only: POST /spendings returns no ID and
  // /spendings/upload needs the spendingID, so the file can't be persisted at
  // creation. Local preview only; add the receipt after creation via the row's
  // receipt icon. See REFACTO_NOTES.md §9.
  const [isReceiptToggle, setIsReceiptToggle] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isReceiptDragging, setIsReceiptDragging] = useState(false);

  const onReceiptFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (e) =>
      setReceiptPreview(
        typeof e.target?.result === "string" ? e.target.result : null,
      );
    reader.readAsDataURL(file);
  };
  const clearReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const initialDateStr = (() => {
    if (isSpendingItem(spending) && spending.date) {
      return spending.date.slice(0, 10);
    }
    return date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
  })();

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SpendingForm>({
    resolver: zodResolver(spendingSchema),
    mode: "onChange",
    defaultValues: {
      spendingLabel: spending?.label ?? "",
      spendingAmount: spending?.amount?.toString() ?? "",
      spendingDate: initialDateStr,
    },
  });

  const stepDate = (delta: number) => {
    const current = getValues("spendingDate");
    const base = current ? parseISO(current) : new Date();
    setValue("spendingDate", format(addDays(base, delta), DATE_FORMAT), {
      shouldValidate: true,
    });
  };

  const labelSuggestions = mockLabelSuggestions(labelQuery);

  const applySuggestion = (suggestion: { label: string; category: string }) => {
    setValue("spendingLabel", suggestion.label, { shouldValidate: true });
    setLabelQuery(suggestion.label);
    const match = categoryOptions.find(
      (c) => c.name.toLowerCase() === suggestion.category.toLowerCase(),
    );
    if (match) {
      setSelectedCategory(match);
    }
  };

  const exactMatch = categoryOptions.find(
    (c) => c.name.toLowerCase() === comboboxQuery.trim().toLowerCase(),
  );

  const onSubmit = (values: SpendingForm) => {
    if (!user) {
      console.error("User is not available");
      return;
    }

    let amountEvaluatedExpr: number;
    try {
      const mexp = new Mexp();
      const lexed = mexp.lex(values.spendingAmount.trim());
      const postfixed = mexp.toPostfix(lexed);
      amountEvaluatedExpr = mexp.postfixEval(postfixed);
    } catch (error) {
      console.error("Invalid amount expression", error);
      return;
    }

    if (Number.isNaN(amountEvaluatedExpr)) {
      return;
    }

    // Category resolution (legacy behaviour): an explicit pick wins; otherwise
    // whatever was typed in the combobox becomes the category — an existing one
    // if it matches, else a brand-new one created on the fly at submit. No
    // separate "create category" step.
    const trimmedQuery = comboboxQuery.trim();
    const resolvedCategory: CategoryOption | null = selectedCategory
      ? selectedCategory
      : trimmedQuery
        ? categoryOptions.find(
            (c) => c.name.toLowerCase() === trimmedQuery.toLowerCase(),
          ) ?? {
            ID: null,
            userID: user.id,
            name: trimmedQuery,
            color: getRandomHexColor(),
          }
        : null;

    const categoryPayload: CategoryOption = resolvedCategory ?? {
      ID: null,
      userID: user.id,
      name: "",
      color: null,
    };

    const spendingDateStr = !asRecurring
      ? values.spendingDate || format(new Date(), "yyyy-MM-dd")
      : null;

    const spendingEdited = {
      date: spendingDateStr,
      label: values.spendingLabel,
      amount: Number(amountEvaluatedExpr),
      category: categoryPayload,
      currency: user.baseCurrency,
      userID: user.id,
      id: spending?.ID,
    };

    // NOTE: a receiptFile attached here is NOT uploaded — see the MOCK note on
    // the receipt state above.

    if (isEditing) {
      if (recurringType) {
        updateRecurring.mutate(spendingEdited);
      } else {
        updateSpending.mutate(spendingEdited);
      }
    } else {
      if (asRecurring) {
        const formattedMonth = {
          start: format(startOfMonth(recurringMonth), "yyyy-MM-dd"),
          end: format(endOfMonth(recurringMonth), "yyyy-MM-dd"),
        };
        createRecurring.mutate({ spendingEdited, formattedMonth });
      } else {
        createSpending.mutate(spendingEdited);
      }
    }

    closeModal();
  };

  const onCreateCategory = (name: string) => {
    const newCategory: CategoryOption = {
      ID: null,
      userID: user?.id ?? null,
      name,
      color: getRandomHexColor(),
    };
    setSelectedCategory(newCategory);
    setComboboxOpen(false);
    setComboboxQuery("");
  };

  const title = isEditing
    ? `Modifier la dépense${asRecurring ? " fixe" : ""}`
    : `Nouvelle dépense${asRecurring ? " fixe" : ""}`;
  const submitLabel = isEditing ? "Enregistrer" : "Ajouter la dépense";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && closeModal()}>
      <DialogContent className="gap-0 overflow-hidden border-line bg-bg-elev p-0 sm:max-w-[480px]">
        <DialogHeader className="flex-row items-center justify-between space-y-0 border-b border-line-soft px-[22px] py-[18px] text-left">
          <DialogTitle className="pr-8 text-[15px] font-semibold tracking-[-0.01em] text-ink">
            {title}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex max-h-[min(78vh,720px)] flex-col gap-[18px] overflow-y-auto px-[22px] py-[22px]"
        >
          {!asRecurring && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="spendingDate" className="text-[13px] text-ink-2">
                Date
              </Label>
              <div className="flex items-stretch overflow-hidden rounded-md border border-line bg-background focus-within:border-accent-d">
                <button
                  type="button"
                  aria-label="Jour précédent"
                  onClick={() => stepDate(-1)}
                  className="grid place-items-center border-r border-line px-3 text-ink-3 transition-colors hover:bg-bg-hi hover:text-ink"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <Input
                  id="spendingDate"
                  type="date"
                  className="num flex-1 rounded-none border-0 bg-transparent text-sm text-ink [color-scheme:dark] focus-visible:ring-0"
                  {...register("spendingDate")}
                />
                <button
                  type="button"
                  aria-label="Jour suivant"
                  onClick={() => stepDate(1)}
                  className="grid place-items-center border-l border-line px-3 text-ink-3 transition-colors hover:bg-bg-hi hover:text-ink"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {asRecurring && !isEditing && (
            <div className="flex flex-col gap-2">
              <Label className="text-[13px] text-ink-2">Mois</Label>
              <div className="flex items-stretch overflow-hidden rounded-md border border-line bg-background focus-within:border-accent-d">
                <button
                  type="button"
                  aria-label="Mois précédent"
                  onClick={() =>
                    setRecurringMonth((m) => startOfMonth(addMonths(m, -1)))
                  }
                  className="grid place-items-center border-r border-line px-3 text-ink-3 transition-colors hover:bg-bg-hi hover:text-ink"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="num flex flex-1 items-center justify-center py-2 text-sm capitalize text-ink">
                  {format(recurringMonth, "MMMM yyyy", { locale: fr })}
                </span>
                <button
                  type="button"
                  aria-label="Mois suivant"
                  onClick={() =>
                    setRecurringMonth((m) => startOfMonth(addMonths(m, 1)))
                  }
                  className="grid place-items-center border-l border-line px-3 text-ink-3 transition-colors hover:bg-bg-hi hover:text-ink"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="spendingLabel" className="text-[13px] text-ink-2">
              Label
            </Label>
            <Input
              id="spendingLabel"
              placeholder="Ex : Boulangerie du coin"
              className="border-line bg-background text-ink placeholder:text-ink-5 focus-visible:border-accent-d focus-visible:ring-0"
              {...register("spendingLabel", {
                onChange: (e) => setLabelQuery(e.target.value),
              })}
            />
            {errors.spendingLabel && (
              <p className="text-xs text-neg">{errors.spendingLabel.message}</p>
            )}
            {!asRecurring && labelSuggestions.length > 0 && (
              // MOCK suggestions (see mockSuggestions.ts)
              <div className="flex flex-wrap gap-1.5">
                {labelSuggestions.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    className="rounded-md border border-line bg-bg-hi px-2 py-1 text-[11px] text-ink-2 transition-colors hover:border-ink-4 hover:text-ink"
                  >
                    {s.label}
                    <span className="text-ink-4"> — {s.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="spendingAmount" className="text-[13px] text-ink-2">
              Montant
            </Label>
            <div className="flex items-baseline gap-2 rounded-md border border-line bg-background px-4 py-3 transition-colors focus-within:border-accent-d">
              <input
                id="spendingAmount"
                inputMode="decimal"
                placeholder="0,00"
                className="num min-w-0 flex-1 bg-transparent text-[28px] font-medium tracking-[-0.02em] text-ink outline-none placeholder:text-ink-5"
                {...register("spendingAmount")}
              />
              <span className="num text-[18px] text-ink-3">€</span>
            </div>
            {errors.spendingAmount && (
              <p className="text-xs text-neg">{errors.spendingAmount.message}</p>
            )}
          </div>

          {!asRecurring && (
            <div className="flex flex-col gap-2">
              <Label className="text-[13px] text-ink-2">Catégorie</Label>
              <Popover
                open={comboboxOpen}
                onOpenChange={(isOpen) => {
                  // On close (click-away / Escape), commit whatever was typed as
                  // the category — matching existing, else a new one — so the
                  // user never has to click a "create" action.
                  if (!isOpen) {
                    const q = comboboxQuery.trim();
                    if (q) {
                      const match = categoryOptions.find(
                        (c) => c.name.toLowerCase() === q.toLowerCase(),
                      );
                      setSelectedCategory(
                        match ?? {
                          ID: null,
                          userID: user?.id ?? null,
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
                      if (
                        !comboboxOpen &&
                        e.key.length === 1 &&
                        !e.ctrlKey &&
                        !e.metaKey &&
                        !e.altKey
                      ) {
                        e.preventDefault();
                        setComboboxQuery(e.key);
                        setComboboxOpen(true);
                      }
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md border bg-background px-3 py-2.5 text-left text-sm text-ink transition-colors hover:border-ink-4",
                      comboboxOpen ? "border-accent-d" : "border-line",
                    )}
                  >
                    {selectedCategory && selectedCategory.name ? (
                      <>
                        <span
                          className="size-2.5 shrink-0 rounded-[3px]"
                          style={{
                            backgroundColor:
                              selectedCategory.color ?? FALLBACK_COLOR,
                          }}
                        />
                        <span className="capitalize">
                          {selectedCategory.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-ink-4">Aucune</span>
                    )}
                    <ChevronsUpDown className="ml-auto size-4 shrink-0 text-ink-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] border-line bg-bg-elev p-0"
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
                              className="mr-1 size-2.5 rounded-[3px]"
                              style={{
                                backgroundColor: category.color ?? FALLBACK_COLOR,
                              }}
                            />
                            <span className="flex-1 capitalize">
                              {category.name}
                            </span>
                            {selectedCategory?.ID === category.ID && (
                              <Check className="size-4 text-accent-strong" />
                            )}
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
                            <span className="mr-1 size-2.5 rounded-[3px] bg-ink-4" />
                            <span className="flex-1 capitalize">
                              {comboboxQuery.trim()}
                            </span>
                          </CommandItem>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {frequentCategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink-4">
                    Fréquentes
                  </span>
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
                            : "border-line bg-bg-hi text-ink-2 hover:text-ink",
                        )}
                      >
                        <span
                          className="size-[7px] shrink-0 rounded-[2px]"
                          style={{ backgroundColor: c.color ?? FALLBACK_COLOR }}
                        />
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!asRecurring && (
            <div className="flex flex-wrap gap-2.5 pt-0.5">
              {canToggleRecurring && (
                <Toggle
                  active={isRecurringToggle}
                  onClick={() => setIsRecurringToggle((v) => !v)}
                >
                  Récurrente mensuelle
                </Toggle>
              )}
              <Toggle
                active={isReceiptToggle}
                onClick={() => setIsReceiptToggle((v) => !v)}
              >
                Joindre un reçu
              </Toggle>
            </div>
          )}

          {!asRecurring && isReceiptToggle && (
            <div className="flex flex-col gap-2">
              {!receiptFile ? (
                <label
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setIsReceiptDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsReceiptDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsReceiptDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsReceiptDragging(false);
                    onReceiptFile(e.dataTransfer.files?.[0]);
                  }}
                  className={cn(
                    // children are pointer-events-none so drag events target the
                    // label itself (no flicker when hovering child elements)
                    "flex cursor-pointer items-center gap-3 rounded-md border-[1.5px] border-dashed px-4 py-3.5 transition-colors [&_*]:pointer-events-none",
                    isReceiptDragging
                      ? "border-elec bg-elec/[0.06]"
                      : "border-line hover:border-elec hover:bg-elec/[0.06]",
                  )}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-elec/10 text-elec">
                    <Upload className="size-5" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-semibold text-ink">
                      Glisser un reçu ou{" "}
                      <span className="text-elec underline underline-offset-2">
                        parcourir
                      </span>
                    </span>
                    <span className="num text-xs text-ink-4">
                      jpg, png, webp
                    </span>
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    hidden
                    onChange={(e) => {
                      onReceiptFile(e.target.files?.[0]);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
              ) : (
                <div className="flex items-center gap-3 rounded-md border border-line bg-background p-2 pr-2.5">
                  {receiptPreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={receiptPreview}
                      alt=""
                      className="size-11 shrink-0 rounded-md object-cover"
                    />
                  )}
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-semibold text-ink">
                      {receiptFile.name}
                    </span>
                    <span className="num text-xs text-ink-4">
                      {humanSize(receiptFile.size)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={clearReceipt}
                    aria-label="Retirer le reçu"
                    className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-bg-hi text-ink-3 transition-colors hover:border-[oklch(0.55_0.15_25)] hover:text-neg"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {recurringType && (recurrings?.length ?? 0) === 0 && (
            // Copy-previous-month is a recurrings-panel affordance only (gated on
            // the recurringType prop, NOT asRecurring): we don't surface it in the
            // timeline "make this recurring" toggle flow, where clicking it would
            // discard the entry the user is mid-creating.
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!user) {
                  console.error("User is not available");
                  return;
                }
                const mStart = startOfMonth(recurringMonth);
                const mEnd = endOfMonth(recurringMonth);
                closeModal();
                copyRecurrings.mutate({
                  userID: user.id,
                  dates: {
                    start: format(mStart, DATE_FORMAT),
                    end: format(mEnd, DATE_FORMAT),
                    previousMonthStart: format(
                      subMonths(mStart, 1),
                      DATE_FORMAT,
                    ),
                    previousMonthEnd: format(subMonths(mEnd, 1), DATE_FORMAT),
                  },
                });
              }}
              className="border-line bg-background text-ink-2 hover:bg-bg-hi"
            >
              <Copy className="size-4" />
              Copier les dépenses fixes du mois précédent
            </Button>
          )}

          <DialogFooter className="gap-2.5 border-t border-line-soft pt-4 sm:gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              className="border-line bg-background text-ink-2 hover:bg-bg-hi"
            >
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SpendingModal;
