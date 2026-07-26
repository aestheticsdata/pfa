"use client";

import { useAuth } from "@auth/context/AuthContext";
import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import useExceptionals from "@components/exceptionals/services/useExceptionals";
import { comboboxTriggerClass } from "@components/shared/comboboxTriggerClass";
import { FieldShell } from "@components/shared/FieldShell";
import { TextInput } from "@components/shared/TextInput";
import { Button } from "@components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@components/ui/command";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { zodResolver } from "@hookform/resolvers/zod";
import useTranslations from "@i18n/useTranslations";
import evaluateAmountExpression from "@lib/amountExpression";
import format from "date-fns/format";
import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { ExceptionalItem } from "@src/schemas/exceptionals";
import type { Dictionary } from "@text/index";

const makeFormSchema = (errors: Dictionary["exceptionals"]["modal"]["errors"]) =>
  z.object({
    label: z.string().min(1, errors.labelRequired),
    // As in the spending modal, a string on purpose: it holds a Mexp expression,
    // evaluated on submit by @lib/amountExpression (COS-109).
    amount: z.string().min(1, errors.amountRequired),
    date: z.string().min(1, errors.dateRequired),
    description: z.string().optional(),
  });

type FormValues = z.infer<ReturnType<typeof makeFormSchema>>;

interface CategoryOption {
  name: string;
  color: string;
}

interface ExceptionalModalProps {
  closeModal: () => void;
  item: ExceptionalItem | null;
  existingCategories: CategoryOption[];
}

const FALLBACK_COLOR = CATEGORY_FALLBACK;

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
  const exceptionals = useTranslations("exceptionals");
  const { modal, actions } = exceptionals;
  const formSchema = makeFormSchema(modal.errors);
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

    const amountEvaluated = evaluateAmountExpression(values.amount);
    if (amountEvaluated === null) {
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
        <DialogHeader className="flex-row items-center justify-between space-y-0 border-b border-line-soft px-5.5 py-4.5 text-left">
          <DialogTitle className="pr-8 text-base font-semibold tracking-snug text-ink">
            {isEditing ? modal.editTitle : modal.createTitle}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4.5 px-5.5 py-5.5"
        >
          <div className="grid grid-cols-2 gap-3.5">
            <FieldShell
              label={modal.fields.date}
              htmlFor="exceptional-date"
            >
              <TextInput
                id="exceptional-date"
                type="date"
                className="num [color-scheme:dark]"
                {...register("date")}
              />
            </FieldShell>
            <FieldShell
              label={modal.fields.amount}
              htmlFor="exceptional-amount"
            >
              <TextInput
                id="exceptional-amount"
                inputMode="decimal"
                placeholder="0,00"
                className="num"
                {...register("amount")}
              />
            </FieldShell>
          </div>
          {/* Date and amount share a 2-column grid row, so their error line sits
              below the row rather than inside either FieldShell — otherwise the
              two columns stop lining up (same pattern as COS-164). */}
          {(errors.date || errors.amount) && (
            <p className="-mt-3 text-xs text-neg">{errors.date?.message ?? errors.amount?.message}</p>
          )}

          <FieldShell
            label={modal.fields.label}
            htmlFor="exceptional-label"
            error={errors.label?.message}
          >
            <TextInput
              id="exceptional-label"
              placeholder={modal.fields.labelPlaceholder}
              {...register("label")}
            />
          </FieldShell>

          <FieldShell
            label={
              <>
                {modal.fields.description} <span className="text-ink-4">{modal.fields.optional}</span>
              </>
            }
            htmlFor="exceptional-description"
          >
            <TextInput
              id="exceptional-description"
              placeholder={modal.fields.descriptionPlaceholder}
              {...register("description")}
            />
          </FieldShell>

          <FieldShell label={modal.fields.category}>
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
                  className={comboboxTriggerClass(comboboxOpen)}
                >
                  {selectedCategory ? (
                    <>
                      <span
                        className="size-2.5 shrink-0 rounded-xs"
                        style={{ backgroundColor: selectedCategory.color }}
                      />
                      <span className="capitalize">{selectedCategory.name}</span>
                    </>
                  ) : (
                    <span className="text-ink-4">{modal.category.nonePlaceholder}</span>
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
                    placeholder={modal.category.searchPlaceholder}
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
                          {modal.category.create(comboboxQuery.trim())}
                        </button>
                      ) : (
                        modal.category.empty
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
                          <span className="text-ink-4">{modal.category.noneItem}</span>
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
                            className="mr-1 size-2.5 rounded-xs"
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
                          <span className="text-accent-strong">{modal.category.create(comboboxQuery.trim())}</span>
                        </CommandItem>
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FieldShell>

          <DialogFooter className="gap-2.5 border-t border-line-soft pt-4 sm:gap-2.5">
            <Button
              type="button"
              variant="muted"
              onClick={closeModal}
            >
              {actions.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !isValid}
            >
              {isEditing ? actions.save : actions.add}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExceptionalModal;
