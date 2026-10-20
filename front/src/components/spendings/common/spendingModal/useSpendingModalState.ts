import { useAuth } from "@auth/context/AuthContext";
import { draftsFromGroup, emptyDraft } from "@components/spendings/common/spendingModal/group/groupLineDrafts";
import useGroupLines from "@components/spendings/common/spendingModal/group/useGroupLines";
import useGroupSubmit from "@components/spendings/common/spendingModal/group/useGroupSubmit";
import { makeSpendingSchema } from "@components/spendings/common/spendingModal/schema";
import { initialSpendingDate } from "@components/spendings/common/spendingModal/spendingModalDates";
import useLabelSuggestionPick from "@components/spendings/common/spendingModal/useLabelSuggestionPick";
import useReceiptPick from "@components/spendings/common/spendingModal/useReceiptPick";
import useSpendingModalCategories from "@components/spendings/common/spendingModal/useSpendingModalCategories";
import useSpendingSubmit from "@components/spendings/common/spendingModal/useSpendingSubmit";
import { SPENDING_MODAL_MODE } from "@components/spendings/config/constants";
import useRecurrings from "@components/spendings/services/useRecurrings";
import useSpendingGroups from "@components/spendings/services/useSpendingGroups";
import useSpendings from "@components/spendings/services/useSpendings";
import { zodResolver } from "@hookform/resolvers/zod";
import useTranslations from "@i18n/useTranslations";
import { startOfMonth } from "date-fns";
import { useState } from "react";
import { useForm } from "react-hook-form";

import type { CategoryOption, SpendingForm } from "@components/spendings/common/spendingModal/schema";
import type { SpendingModalMode } from "@components/spendings/interfaces/spendingGroupTypes";
import type { SpendingModalProps } from "@components/spendings/interfaces/spendingModalTypes";

/**
 * Everything the spending modal holds (PFA-250): the form, the single / group mode,
 * the category picker, the recurring and receipt toggles, the label suggestions and
 * the submits. The modal component only lays it out.
 */
const useSpendingModalState = ({
  date,
  closeModal: closeModalProp,
  spending,
  recurringType = false,
  isEditing,
  month = null,
  group = null,
}: SpendingModalProps) => {
  const spendings = useTranslations("spendings");
  const common = useTranslations("common");
  const [open, setOpen] = useState(true);
  const closeModal = () => {
    setOpen(false);
    setTimeout(closeModalProp, 200);
  };
  const { user } = useAuth();
  const { createSpending, updateSpending } = useSpendings();
  const { recurrings, createRecurring, updateRecurring, copyRecurrings } = useRecurrings();
  const { createGroup, updateGroup } = useSpendingGroups();
  const { categoryOptions, frequentCategories } = useSpendingModalCategories();

  const initialCategory: CategoryOption | null = spending?.category
    ? {
        ID: spending.categoryID ?? null,
        userID: user?.id ?? null,
        name: spending.category ?? "",
        color: spending.categoryColor ?? null,
      }
    : null;

  const [selectedCategory, setSelectedCategory] = useState<CategoryOption | null>(initialCategory);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  // Single spending or group of lines on one receipt (PFA-189). Editing keeps
  // the shape of what is edited; a dashboard fixed expense is never a group.
  const [mode, setMode] = useState<SpendingModalMode>(group ? SPENDING_MODAL_MODE.group : SPENDING_MODAL_MODE.single);
  const isGroup = mode === SPENDING_MODAL_MODE.group;
  const canSwitchMode = !isEditing && !recurringType;
  const groupLines = useGroupLines(() => (group ? draftsFromGroup(group, user?.id ?? null) : []));
  const [comboboxQuery, setComboboxQuery] = useState("");
  // "Monthly recurring" toggle — only offered when creating a plain spending
  // from the timeline (never in edit mode, never when already a recurring).
  const [isRecurringToggle, setIsRecurringToggle] = useState(false);
  const asRecurring = recurringType || (isRecurringToggle && !isGroup);
  const canToggleRecurring = !isEditing && !recurringType;

  // Month a new recurring belongs to (its start/end window): always the viewed
  // month. A recurring has no single date, so the modal no longer swaps the
  // Date field for a month stepper — it just disables Date when recurring.
  const [recurringMonth] = useState<Date>(() => (month?.start ? startOfMonth(month.start) : startOfMonth(new Date())));

  // Receipt picked at creation: kept locally for the preview, then uploaded on
  // the created row's ID by the create mutation (chained in useSpendings, PFA-5).
  const [isReceiptToggle, setIsReceiptToggle] = useState(false);
  const { receiptFile, receiptPreview, onReceiptFile, clearReceipt } = useReceiptPick();

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SpendingForm>({
    resolver: zodResolver(makeSpendingSchema(spendings.modal.validation, common.validation, mode)),
    mode: "onChange",
    defaultValues: {
      spendingLabel: group?.label ?? spending?.label ?? "",
      spendingAmount: spending?.amount?.toString() ?? "",
      spendingDate: initialSpendingDate(spending, date),
    },
  });

  // Suggestions come from the user's real past labels (COS-23); never fetched for
  // recurrings, which don't show them.
  const { labelSuggestions, applySuggestion, setLabelQuery } = useLabelSuggestionPick({
    initialLabel: spending?.label ?? "",
    enabled: !asRecurring,
    setValue,
    categoryOptions,
    setSelectedCategory,
  });

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
    receiptFile,
    createSpending,
    updateSpending,
    createRecurring,
    updateRecurring,
    closeModal,
  });

  const onGroupSubmit = useGroupSubmit({
    user,
    group,
    validateLines: groupLines.validate,
    receiptFile,
    createGroup,
    updateGroup,
    closeModal,
  });

  // The first switch to group mode seeds two lines: the category and amount
  // already typed, then the next most frequent category, empty (PFA-189).
  const changeMode = (next: SpendingModalMode) => {
    if (next === SPENDING_MODAL_MODE.group && groupLines.drafts.length === 0) {
      const second = frequentCategories.find((c) => c.name !== selectedCategory?.name) ?? null;
      groupLines.replaceLines([emptyDraft(selectedCategory, getValues("spendingAmount")), emptyDraft(second)]);
    }
    clearErrors();
    setMode(next);
  };

  // Title tracks recurringType (dashboard "fixed expense" entry) only, NOT the
  // in-modal toggle — so ticking "Monthly recurring" keeps the title stable
  // instead of making the modal look like a different one.
  const { modal } = spendings;
  const { groups: groupTexts } = spendings;
  const title = group
    ? groupTexts.editTitle
    : isEditing
      ? modal.title.edit(recurringType)
      : modal.title.create(recurringType);
  const submitLabel = isEditing
    ? modal.submit.save
    : isGroup
      ? groupTexts.submitAdd(groupLines.drafts.length)
      : modal.submit.add;

  return {
    open,
    closeModal,
    spendings,
    modal,
    groupTexts,
    title,
    submitLabel,
    user,
    recurrings,
    copyRecurrings,
    recurringMonth,
    categoryOptions,
    frequentCategories,
    selectedCategory,
    setSelectedCategory,
    comboboxOpen,
    setComboboxOpen,
    comboboxQuery,
    setComboboxQuery,
    mode,
    isGroup,
    canSwitchMode,
    changeMode,
    groupLines,
    asRecurring,
    canToggleRecurring,
    isRecurringToggle,
    setIsRecurringToggle,
    isReceiptToggle,
    setIsReceiptToggle,
    receiptFile,
    receiptPreview,
    onReceiptFile,
    clearReceipt,
    register,
    handleSubmit,
    getValues,
    setValue,
    clearErrors,
    errors,
    isSubmitting,
    labelSuggestions,
    applySuggestion,
    setLabelQuery,
    onSubmit,
    onGroupSubmit,
  };
};

export default useSpendingModalState;
