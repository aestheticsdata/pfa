"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Mexp from "math-expression-evaluator";
import format from "date-fns/format";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { useAuth } from "@auth/context/AuthContext";
import useExceptionals from "@components/exceptionals/services/useExceptionals";

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

const ExceptionalModal = ({
  closeModal: closeModalProp,
  item,
  existingCategories,
}: ExceptionalModalProps) => {
  const [open, setOpen] = useState(true);
  const closeModal = () => {
    setOpen(false);
    setTimeout(closeModalProp, 200);
  };

  const { user } = useAuth();
  const { createExceptional, updateExceptional } = useExceptionals();
  const isEditing = !!item;

  const initialCategory: CategoryOption | null =
    item?.categoryName
      ? { name: item.categoryName, color: item.categoryColor ?? "#94a3b8" }
      : null;

  const [selectedCategory, setSelectedCategory] = useState<CategoryOption | null>(
    initialCategory,
  );
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [comboboxQuery, setComboboxQuery] = useState("");

  const initialDateStr = item?.date
    ? item.date.slice(0, 10)
    : format(new Date(), "yyyy-MM-dd");

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

  const categoryOptions = useMemo(
    () => existingCategories,
    [existingCategories],
  );

  const exactMatch = categoryOptions.find(
    (c) => c.name.toLowerCase() === comboboxQuery.trim().toLowerCase(),
  );

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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && closeModal()}>
      <DialogContent className="bg-gradient-to-br from-[#121212] via-[#0a0a0a] to-black border-gray-800 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-gray-100">
            {isEditing ? "Modifier" : "Ajouter"} une dépense exceptionnelle
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="exceptional-date" className="text-gray-300">
              Date
            </Label>
            <Input
              id="exceptional-date"
              type="date"
              className="bg-[#0c0c0c] border-gray-700/50 text-gray-100 focus-visible:border-cyan-500 [color-scheme:dark]"
              {...register("date")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="exceptional-label" className="text-gray-300">
              Label
            </Label>
            <Input
              id="exceptional-label"
              placeholder="Ex: MacBook Pro"
              className="bg-[#0c0c0c] border-gray-700/50 text-gray-100 placeholder:text-gray-500 focus-visible:border-cyan-500"
              {...register("label")}
            />
            {errors.label && (
              <p className="text-xs text-destructive">{errors.label.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="exceptional-amount" className="text-gray-300">
              Montant (€)
            </Label>
            <Input
              id="exceptional-amount"
              placeholder="0.00"
              className="bg-[#0c0c0c] border-gray-700/50 text-gray-100 placeholder:text-gray-500 focus-visible:border-cyan-500"
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="exceptional-description" className="text-gray-300">
              Description
            </Label>
            <Input
              id="exceptional-description"
              placeholder="Ex: Ordinateur portable pro"
              className="bg-[#0c0c0c] border-gray-700/50 text-gray-100 placeholder:text-gray-500 focus-visible:border-cyan-500"
              {...register("description")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-gray-300">Catégorie</Label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen} modal>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="flex items-center justify-between w-full px-3 py-2 bg-[#0c0c0c] border border-gray-700/50 rounded-md text-sm text-gray-200 hover:bg-[#151515] transition-colors"
                >
                  {selectedCategory ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: selectedCategory.color }}
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
                            className="w-2 h-2 rounded-full mr-1"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="flex-1">{cat.name}</span>
                          {selectedCategory?.name === cat.name && (
                            <Check className="w-4 h-4" />
                          )}
                        </CommandItem>
                      ))}
                      {comboboxQuery.trim() && !exactMatch && (
                        <CommandItem
                          value={`__create-${comboboxQuery.trim()}`}
                          onSelect={() => onCreateCategory(comboboxQuery.trim())}
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

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              className="border-gray-700/50 bg-[#0c0c0c] text-gray-200 hover:bg-[#151515]"
            >
              Annuler
            </Button>
            <Button type="submit" variant="cyan" disabled={isSubmitting || !isValid}>
              {isEditing ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExceptionalModal;
