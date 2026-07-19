"use client";

import { useAuth } from "@auth/context/AuthContext";
import useCategoryStats from "@components/categories/services/useCategoryStats";
import AmountField from "@components/spendings/common/spendingModal/fields/AmountField";
import CategoryField from "@components/spendings/common/spendingModal/fields/CategoryField";
import DateField from "@components/spendings/common/spendingModal/fields/DateField";
import LabelField from "@components/spendings/common/spendingModal/fields/LabelField";
import ReceiptField from "@components/spendings/common/spendingModal/fields/ReceiptField";
import { mockLabelSuggestions } from "@components/spendings/common/spendingModal/mockSuggestions";
import { rankFrequentCategories } from "@components/spendings/common/spendingModal/rankFrequentCategories";
import { spendingSchema } from "@components/spendings/common/spendingModal/schema";
import Toggle from "@components/spendings/common/spendingModal/Toggle";
import useSpendingSubmit from "@components/spendings/common/spendingModal/useSpendingSubmit";
import { DATE_FORMAT } from "@components/spendings/config/constants";
import useCategories from "@components/spendings/services/useCategories";
import useReccurings from "@components/spendings/services/useReccurings";
import useSpendings from "@components/spendings/services/useSpendings";
import { Button } from "@components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import spendings from "@text/spendings";
import endOfMonth from "date-fns/endOfMonth";
import format from "date-fns/format";
import startOfMonth from "date-fns/startOfMonth";
import subMonths from "date-fns/subMonths";
import { Copy } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import type { CategoryOption, SpendingForm } from "@components/spendings/common/spendingModal/schema";
import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";
import type { SpendingItem, SpendingListItem } from "@components/spendings/types";

interface SpendingModalProps {
  date?: Date;
  closeModal: () => void;
  spending: SpendingListItem | null;
  recurringType?: boolean;
  isEditing: boolean;
  month?: MonthRange | null;
}

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
  const { recurrings, createRecurring, updateRecurring, copyRecurrings } = useReccurings();
  const { categories, error: categoriesError } = useCategories();
  if (categoriesError) {
    throw categoriesError;
  }
  // All-time per-category usage (shared source with the Categories page, COS-20)
  // — ranks the "Fréquentes" quick-picks. Never blocks the modal: while stats
  // load (or on error) the section is simply empty until real usage arrives.
  const { categoryStats } = useCategoryStats();

  const categoryOptions: CategoryOption[] = (categories ?? []).map((c) => ({
    ID: c.ID,
    userID: c.userID,
    name: c.name,
    color: c.color,
  }));

  const frequentCategories = rankFrequentCategories(categoryOptions, categoryStats?.byCategory);

  const isSpendingItem = (v: SpendingListItem | null): v is SpendingItem => !!v && "date" in v;

  const initialCategory: CategoryOption | null =
    isSpendingItem(spending) && spending.category
      ? {
          ID: spending.categoryID ?? null,
          userID: user?.id ?? null,
          name: spending.category ?? "",
          color: spending.categoryColor ?? null,
        }
      : null;

  const [selectedCategory, setSelectedCategory] = useState<CategoryOption | null>(initialCategory);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [comboboxQuery, setComboboxQuery] = useState("");
  const [labelQuery, setLabelQuery] = useState(spending?.label ?? "");
  // "Récurrente mensuelle" toggle — only offered when creating a plain spending
  // from the timeline (never in edit mode, never when already a recurring).
  const [isRecurringToggle, setIsRecurringToggle] = useState(false);
  const asRecurring = recurringType || isRecurringToggle;
  const canToggleRecurring = !isEditing && !recurringType;

  // Month a new recurring belongs to (its start/end window): always the viewed
  // month. A recurring has no single date, so the modal no longer swaps the
  // Date field for a month stepper — it just disables Date when recurring.
  const [recurringMonth] = useState<Date>(() => (month?.start ? startOfMonth(month.start) : startOfMonth(new Date())));

  // MOCK — receipt-at-creation is visual only: POST /spendings returns no ID and
  // /spendings/upload needs the spendingID, so the file can't be persisted at
  // creation. Local preview only; add the receipt after creation via the row's
  // receipt icon. De-mock tracked in COS-24. See REFACTO_NOTES.md §9.
  const [isReceiptToggle, setIsReceiptToggle] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const onReceiptFile = (file: File | undefined) => {
    if (!file?.type.startsWith("image/")) return;
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setReceiptPreview(typeof e.target?.result === "string" ? e.target.result : null);
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

  const labelSuggestions = mockLabelSuggestions(labelQuery);

  const applySuggestion = (suggestion: { label: string; category: string }) => {
    setValue("spendingLabel", suggestion.label, { shouldValidate: true });
    setLabelQuery(suggestion.label);
    const match = categoryOptions.find((c) => c.name.toLowerCase() === suggestion.category.toLowerCase());
    if (match) {
      setSelectedCategory(match);
    }
  };

  const onSubmit = useSpendingSubmit({
    user,
    spending,
    isEditing,
    recurringType,
    asRecurring,
    recurringMonth,
    categoryOptions,
    selectedCategory,
    comboboxQuery,
    createSpending,
    updateSpending,
    createRecurring,
    updateRecurring,
    closeModal,
  });

  // Title tracks recurringType (dashboard "dépense fixe" entry) only, NOT the
  // in-modal toggle — so ticking "Récurrente mensuelle" keeps the title stable
  // instead of making the modal look like a different one.
  const { modal } = spendings;
  const title = isEditing ? modal.title.edit(recurringType) : modal.title.create(recurringType);
  const submitLabel = isEditing ? modal.submit.save : modal.submit.add;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModal()}
    >
      <DialogContent className="gap-0 overflow-hidden border-line bg-surface-elev p-0 sm:max-w-[480px]">
        <DialogHeader className="flex-row items-center justify-between space-y-0 border-b border-line-soft px-5.5 py-4.5 text-left">
          <DialogTitle className="pr-8 text-base font-semibold tracking-normal text-ink">{title}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex max-h-[min(78vh,720px)] flex-col gap-4.5 overflow-y-auto px-5.5 py-5.5"
        >
          <DateField
            register={register}
            getValues={getValues}
            setValue={setValue}
            asRecurring={asRecurring}
          />

          <LabelField
            register={register}
            errors={errors}
            asRecurring={asRecurring}
            labelSuggestions={labelSuggestions}
            applySuggestion={applySuggestion}
            setLabelQuery={setLabelQuery}
          />

          <AmountField
            register={register}
            errors={errors}
          />

          {/* Category is hidden for recurrings: the backend/DB have no notion of
              a category on a recurring (no column, postRecurringController drops
              it, RecurringItemSchema omits it). Enabling it needs DB + back work
              — tracked separately, not in this modal-layout fix. */}
          {!asRecurring && (
            <CategoryField
              categoryOptions={categoryOptions}
              frequentCategories={frequentCategories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              comboboxOpen={comboboxOpen}
              setComboboxOpen={setComboboxOpen}
              comboboxQuery={comboboxQuery}
              setComboboxQuery={setComboboxQuery}
              userId={user?.id ?? null}
            />
          )}

          <div className="flex flex-wrap gap-2.5 pt-0.5">
            {canToggleRecurring && (
              <Toggle
                active={isRecurringToggle}
                onClick={() => setIsRecurringToggle((v) => !v)}
              >
                {modal.recurringToggle}
              </Toggle>
            )}
            {/* Receipt is not applicable to a recurring — disabled, not removed. */}
            <Toggle
              active={isReceiptToggle}
              onClick={() => setIsReceiptToggle((v) => !v)}
              disabled={asRecurring}
            >
              {modal.attachReceipt}
            </Toggle>
          </div>

          {!asRecurring && isReceiptToggle && (
            <ReceiptField
              receiptFile={receiptFile}
              receiptPreview={receiptPreview}
              onReceiptFile={onReceiptFile}
              clearReceipt={clearReceipt}
            />
          )}

          {recurringType && (recurrings?.length ?? 0) === 0 && (
            // Copy-previous-month is a recurrings-panel affordance only (gated on
            // the recurringType prop, NOT asRecurring): we don't surface it in the
            // timeline "make this recurring" toggle flow, where clicking it would
            // discard the entry the user is mid-creating.
            <Button
              type="button"
              variant="muted"
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
                    previousMonthStart: format(subMonths(mStart, 1), DATE_FORMAT),
                    previousMonthEnd: format(subMonths(mEnd, 1), DATE_FORMAT),
                  },
                });
              }}
            >
              <Copy className="size-4" />
              {modal.copyPreviousMonth}
            </Button>
          )}

          <DialogFooter className="gap-2.5 border-t border-line-soft pt-4 sm:gap-2.5">
            <Button
              type="button"
              variant="muted"
              onClick={closeModal}
            >
              {spendings.actions.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SpendingModal;
