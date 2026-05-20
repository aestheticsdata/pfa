"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Mexp from "math-expression-evaluator";
import subMonths from "date-fns/subMonths";
import format from "date-fns/format";
import { Check, ChevronsUpDown, Copy } from "lucide-react";
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

  const initialDateStr = (() => {
    if (isSpendingItem(spending) && spending.date) {
      return spending.date.slice(0, 10);
    }
    return date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
  })();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SpendingForm>({
    resolver: zodResolver(spendingSchema),
    mode: "onChange",
    defaultValues: {
      spendingLabel: spending?.label ?? "",
      spendingAmount: spending?.amount?.toString() ?? "",
      spendingDate: initialDateStr,
    },
  });

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

    const categoryPayload: CategoryOption = selectedCategory
      ? selectedCategory
      : {
          ID: null,
          userID: user.id,
          name: "",
          color: null,
        };

    const spendingDateStr = !recurringType
      ? (values.spendingDate || format(new Date(), "yyyy-MM-dd"))
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

    if (isEditing) {
      if (recurringType) {
        updateRecurring.mutate(spendingEdited);
      } else {
        updateSpending.mutate(spendingEdited);
      }
    } else {
      if (recurringType) {
        if (!month) {
          throw new Error("Missing month range for recurring spending modal");
        }
        const formattedMonth = {
          start: format(month.start, "yyyy-MM-dd"),
          end: format(month.end, "yyyy-MM-dd"),
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

  const titleSuffix = recurringType ? "fixe" : "";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && closeModal()}>
      <DialogContent className="bg-gradient-to-br from-[#121212] via-[#0a0a0a] to-black border-gray-800 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-gray-100">
            {isEditing ? "Modifier" : "Ajouter"} une dépense {titleSuffix}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {!recurringType && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="spendingDate" className="text-gray-300">
                Date
              </Label>
              <Input
                id="spendingDate"
                type="date"
                className="bg-[#0c0c0c] border-gray-700/50 text-gray-100 focus-visible:border-cyan-500 [color-scheme:dark]"
                {...register("spendingDate")}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="spendingLabel" className="text-gray-300">
              Label
            </Label>
            <Input
              id="spendingLabel"
              placeholder="Ex: Croissant"
              className="bg-[#0c0c0c] border-gray-700/50 text-gray-100 placeholder:text-gray-500 focus-visible:border-cyan-500"
              {...register("spendingLabel")}
            />
            {errors.spendingLabel && (
              <p className="text-xs text-destructive">
                {errors.spendingLabel.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="spendingAmount" className="text-gray-300">
              Montant (€)
            </Label>
            <Input
              id="spendingAmount"
              placeholder="0.00"
              className="bg-[#0c0c0c] border-gray-700/50 text-gray-100 placeholder:text-gray-500 focus-visible:border-cyan-500"
              {...register("spendingAmount")}
            />
            {errors.spendingAmount && (
              <p className="text-xs text-destructive">
                {errors.spendingAmount.message}
              </p>
            )}
          </div>

          {!recurringType && (
            <div className="flex flex-col gap-2">
              <Label className="text-gray-300">Catégorie</Label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen} modal>
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
                    className="flex items-center justify-between w-full px-3 py-2 bg-[#0c0c0c] border border-gray-700/50 rounded-md text-sm text-gray-200 hover:bg-[#151515] transition-colors"
                  >
                    {selectedCategory && selectedCategory.name ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor:
                              selectedCategory.color ?? "#94a3b8",
                          }}
                        />
                        {selectedCategory.name}
                      </span>
                    ) : (
                      <span className="text-gray-500">Aucune</span>
                    )}
                    <ChevronsUpDown className="w-4 h-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0 bg-[#0c0c0c] border-gray-700/50"
                  align="start"
                >
                  <Command className="bg-transparent">
                    <CommandInput
                      placeholder="Rechercher ou créer…"
                      value={comboboxQuery}
                      onValueChange={setComboboxQuery}
                      className="text-gray-200"
                    />
                    <CommandList>
                      <CommandEmpty>
                        {comboboxQuery.trim() ? (
                          <button
                            type="button"
                            className="px-3 py-1 text-xs text-cyan-400 hover:text-cyan-300"
                            onClick={() => onCreateCategory(comboboxQuery.trim())}
                          >
                            Créer “{comboboxQuery.trim()}”
                          </button>
                        ) : (
                          "Aucune catégorie."
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {selectedCategory && (
                          <CommandItem
                            value="__none"
                            onSelect={() => {
                              setSelectedCategory(null);
                              setComboboxOpen(false);
                            }}
                          >
                            <span className="text-gray-500">
                              Aucune catégorie
                            </span>
                          </CommandItem>
                        )}
                        {categoryOptions.map((category) => (
                          <CommandItem
                            key={category.ID ?? category.name}
                            value={category.name}
                            onSelect={() => {
                              setSelectedCategory(category);
                              setComboboxOpen(false);
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full mr-1"
                              style={{
                                backgroundColor: category.color ?? "#94a3b8",
                              }}
                            />
                            <span className="flex-1">{category.name}</span>
                            {selectedCategory?.ID === category.ID && (
                              <Check className="w-4 h-4" />
                            )}
                          </CommandItem>
                        ))}
                        {comboboxQuery.trim() &&
                          !exactMatch && (
                            <CommandItem
                              value={`__create-${comboboxQuery.trim()}`}
                              onSelect={() =>
                                onCreateCategory(comboboxQuery.trim())
                              }
                            >
                              <span className="text-cyan-400">
                                Créer “{comboboxQuery.trim()}”
                              </span>
                            </CommandItem>
                          )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {recurringType && (recurrings?.length ?? 0) === 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!user) {
                  console.error("User is not available");
                  return;
                }
                if (!month) {
                  throw new Error(
                    "Missing month range for recurring copy action",
                  );
                }
                closeModal();
                copyRecurrings.mutate({
                  userID: user.id,
                  dates: {
                    start: format(month.start, DATE_FORMAT),
                    end: format(month.end, DATE_FORMAT),
                    previousMonthStart: format(
                      subMonths(month.start, 1),
                      DATE_FORMAT,
                    ),
                    previousMonthEnd: format(
                      subMonths(month.end, 1),
                      DATE_FORMAT,
                    ),
                  },
                });
              }}
              className={cn(
                "border-gray-700/50 bg-[#0c0c0c] text-gray-200 hover:bg-[#151515]",
              )}
            >
              <Copy className="w-4 h-4" />
              Copier les dépenses fixes du mois précédent
            </Button>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              className="border-gray-700/50 bg-[#0c0c0c] text-gray-200 hover:bg-[#151515]"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="cyan"
              disabled={isSubmitting || !isValid}
            >
              {isEditing ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SpendingModal;
