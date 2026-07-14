"use client";

import { useAuth } from "@auth/context/AuthContext";
import useExceptionals from "@components/exceptionals/services/useExceptionals";
import { Button } from "@components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@components/ui/command";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@lib/utils";
import format from "date-fns/format";
import { Check, ChevronsUpDown } from "lucide-react";
import Mexp from "math-expression-evaluator";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { ExceptionalItem } from "@src/schemas/exceptionals";

const formSchema = z.object({
  label: z.string().min(1, "Label requis"),
  amount: z.string().min(1, "Montant requis"),
  date: z.string().min(1, "Date requise"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryOption {
  name: string;
  color: string;
}

interface ExceptionalModalProps {
  closeModal: () => void;
  item: ExceptionalItem | null;
  existingCategories: CategoryOption[];
}

const FALLBACK_COLOR = "#94a3b8";

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

const ExceptionalModal = ({ closeModal: closeModalProp, item, existingCategories }: ExceptionalModalProps) => {
  const [open, setOpen] = useState(true);
  const closeModal = () => {
    setOpen(false);
    setTimeout(closeModalProp, 200);
  };

  const { user } = useAuth();
  const { createExceptional, updateExceptional } = useExceptionals();
  const isEditing = !!item;

  const initialCategory: CategoryOption | null = item?.categoryName
    ? { name: item.categoryName, color: item.categoryColor ?? FALLBACK_COLOR }
    : null;

  const [selectedCategory, setSelectedCategory] = useState<CategoryOption | null>(initialCategory);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [comboboxQuery, setComboboxQuery] = useState("");

  const initialDateStr = item?.date ? item.date.slice(0, 10) : format(new Date(), "yyyy-MM-dd");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      label: item?.label ?? "",
      amount: item?.amount?.toString() ?? "",
      date: initialDateStr,
      description: item?.description ?? "",
    },
  });

  const categoryOptions = useMemo(() => existingCategories, [existingCategories]);

  const exactMatch = categoryOptions.find((c) => c.name.toLowerCase() === comboboxQuery.trim().toLowerCase());

  const onSubmit = (values: FormValues) => {
    if (!user) {
      console.error("User is not available");
      return;
    }

    let amountEvaluated: number;
    try {
      const mexp = new Mexp();
      const lexed = mexp.lex(values.amount.trim());
      const postfixed = mexp.toPostfix(lexed);
      amountEvaluated = mexp.postfixEval(postfixed);
    } catch (error) {
      console.error("Invalid amount expression", error);
      return;
    }

    if (Number.isNaN(amountEvaluated)) {
      return;
    }

    const payload = {
      id: item?.ID,
      date: values.date,
      label: values.label,
      description: values.description || null,
      amount: amountEvaluated,
      currency: user.baseCurrency,
      categoryName: selectedCategory?.name ?? null,
      categoryColor: selectedCategory?.color ?? null,
    };

    if (isEditing) {
      updateExceptional.mutate(payload);
    } else {
      createExceptional.mutate(payload);
    }

    closeModal();
  };

  const onCreateCategory = (name: string) => {
    setSelectedCategory({ name, color: getRandomHexColor() });
    setComboboxOpen(false);
    setComboboxQuery("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModal()}
    >
      <DialogContent className="gap-0 overflow-hidden border-line bg-surface-elev p-0 sm:max-w-[440px]">
        <DialogHeader className="flex-row items-center justify-between space-y-0 border-b border-line-soft px-[22px] py-[18px] text-left">
          <DialogTitle className="pr-8 text-[15px] font-semibold tracking-[-0.01em] text-ink">
            {isEditing ? "Modifier l'achat exceptionnel" : "Nouvel achat exceptionnel"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-[18px] px-[22px] py-[22px]"
        >
          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="exceptional-date"
                className="text-[13px] text-ink-2"
              >
                Date
              </Label>
              <Input
                id="exceptional-date"
                type="date"
                className="num border-line bg-background text-ink [color-scheme:dark] focus-visible:border-accent-d focus-visible:ring-0"
                {...register("date")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="exceptional-amount"
                className="text-[13px] text-ink-2"
              >
                Montant (€)
              </Label>
              <Input
                id="exceptional-amount"
                inputMode="decimal"
                placeholder="0,00"
                className="num border-line bg-background text-ink placeholder:text-ink-5 focus-visible:border-accent-d focus-visible:ring-0"
                {...register("amount")}
              />
            </div>
          </div>
          {errors.amount && <p className="-mt-3 text-xs text-neg">{errors.amount.message}</p>}

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="exceptional-label"
              className="text-[13px] text-ink-2"
            >
              Label
            </Label>
            <Input
              id="exceptional-label"
              placeholder="Ex : Climatiseur mobile"
              className="border-line bg-background text-ink placeholder:text-ink-5 focus-visible:border-accent-d focus-visible:ring-0"
              {...register("label")}
            />
            {errors.label && <p className="text-xs text-neg">{errors.label.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="exceptional-description"
              className="text-[13px] text-ink-2"
            >
              Description <span className="text-ink-4">(optionnel)</span>
            </Label>
            <Input
              id="exceptional-description"
              placeholder="Ex : Ordinateur portable pro"
              className="border-line bg-background text-ink placeholder:text-ink-5 focus-visible:border-accent-d focus-visible:ring-0"
              {...register("description")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-[13px] text-ink-2">Catégorie</Label>
            <Popover
              open={comboboxOpen}
              onOpenChange={setComboboxOpen}
              modal
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md border bg-background px-3 py-2.5 text-left text-sm text-ink transition-colors hover:border-ink-4",
                    comboboxOpen ? "border-accent-d" : "border-line",
                  )}
                >
                  {selectedCategory ? (
                    <>
                      <span
                        className="size-2.5 shrink-0 rounded-[3px]"
                        style={{ backgroundColor: selectedCategory.color }}
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
                    placeholder="Rechercher ou créer…"
                    value={comboboxQuery}
                    onValueChange={setComboboxQuery}
                    className="text-ink"
                  />
                  <CommandList>
                    <CommandEmpty>
                      {comboboxQuery.trim() ? (
                        <button
                          type="button"
                          className="px-3 py-1 text-xs text-accent-strong hover:brightness-110"
                          onClick={() => onCreateCategory(comboboxQuery.trim())}
                        >
                          Créer «&nbsp;{comboboxQuery.trim()}&nbsp;»
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
                          <span className="text-ink-4">Aucune catégorie</span>
                        </CommandItem>
                      )}
                      {categoryOptions.map((cat) => (
                        <CommandItem
                          key={cat.name}
                          value={cat.name}
                          onSelect={() => {
                            setSelectedCategory(cat);
                            setComboboxOpen(false);
                          }}
                        >
                          <span
                            className="mr-1 size-2.5 rounded-[3px]"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="flex-1 capitalize">{cat.name}</span>
                          {selectedCategory?.name === cat.name && <Check className="size-4 text-accent-strong" />}
                        </CommandItem>
                      ))}
                      {comboboxQuery.trim() && !exactMatch && (
                        <CommandItem
                          value={`__create-${comboboxQuery.trim()}`}
                          onSelect={() => onCreateCategory(comboboxQuery.trim())}
                        >
                          <span className="text-accent-strong">Créer «&nbsp;{comboboxQuery.trim()}&nbsp;»</span>
                        </CommandItem>
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter className="gap-2.5 border-t border-line-soft pt-4 sm:gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              className="border-line bg-background text-ink-2 hover:bg-surface-hi"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !isValid}
            >
              {isEditing ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExceptionalModal;
