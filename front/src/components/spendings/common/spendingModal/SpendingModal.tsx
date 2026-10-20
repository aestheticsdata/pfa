"use client";

import CopyRecurringsButton from "@components/spendings/common/spendingModal/CopyRecurringsButton";
import AmountField from "@components/spendings/common/spendingModal/fields/AmountField";
import CategoryField from "@components/spendings/common/spendingModal/fields/CategoryField";
import DateField from "@components/spendings/common/spendingModal/fields/DateField";
import LabelField from "@components/spendings/common/spendingModal/fields/LabelField";
import ReceiptField from "@components/spendings/common/spendingModal/fields/ReceiptField";
import GroupLinesField from "@components/spendings/common/spendingModal/group/GroupLinesField";
import ModeSwitch from "@components/spendings/common/spendingModal/group/ModeSwitch";
import SpendingModalToggles from "@components/spendings/common/spendingModal/SpendingModalToggles";
import { recurringCopyDates } from "@components/spendings/common/spendingModal/spendingModalDates";
import useSpendingModalState from "@components/spendings/common/spendingModal/useSpendingModalState";
import { Button } from "@components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { cn } from "@lib/utils";

import type { SpendingModalProps } from "@components/spendings/interfaces/spendingModalTypes";

const SpendingModal = (props: SpendingModalProps) => {
  const { isEditing, recurringType = false } = props;
  const state = useSpendingModalState(props);

  return (
    <Dialog
      open={state.open}
      onOpenChange={(isOpen) => !isOpen && state.closeModal()}
    >
      <DialogContent
        data-testid="spending-modal"
        className={cn(
          "gap-0 overflow-hidden border-line bg-surface-elev p-0",
          state.isGroup ? "sm:max-w-170" : "sm:max-w-[480px]",
        )}
      >
        <DialogHeader className="flex-row items-center justify-between space-y-0 border-b border-line-soft px-5.5 py-4.5 text-left">
          <DialogTitle className="pr-8 text-base font-semibold tracking-normal text-ink">{state.title}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={state.handleSubmit(state.isGroup ? state.onGroupSubmit : state.onSubmit)}
          className="flex max-h-[min(78vh,720px)] flex-col gap-4.5 overflow-y-auto px-5.5 py-5.5"
        >
          {state.canSwitchMode && (
            <ModeSwitch
              mode={state.mode}
              onChange={state.changeMode}
            />
          )}

          <DateField
            register={state.register}
            getValues={state.getValues}
            setValue={state.setValue}
            asRecurring={state.asRecurring}
          />

          <LabelField
            register={state.register}
            error={state.errors.spendingLabel?.message}
            clearErrors={state.clearErrors}
            hideSuggestions={state.asRecurring || state.isGroup}
            label={state.isGroup ? state.groupTexts.nameLabel : state.modal.fields.label}
            placeholder={state.isGroup ? state.groupTexts.namePlaceholder : state.modal.fields.labelPlaceholder}
            labelSuggestions={state.labelSuggestions}
            applySuggestion={state.applySuggestion}
            setLabelQuery={state.setLabelQuery}
          />

          {state.isGroup ? (
            <GroupLinesField
              drafts={state.groupLines.drafts}
              invalidKeys={state.groupLines.invalidKeys}
              categoryOptions={state.categoryOptions}
              updateLine={state.groupLines.updateLine}
              addLine={state.groupLines.addLine}
              removeLine={state.groupLines.removeLine}
            />
          ) : (
            <AmountField
              register={state.register}
              error={state.errors.spendingAmount?.message}
            />
          )}

          {!state.isGroup && (
            <CategoryField
              categoryOptions={state.categoryOptions}
              frequentCategories={state.frequentCategories}
              selectedCategory={state.selectedCategory}
              setSelectedCategory={state.setSelectedCategory}
              comboboxOpen={state.comboboxOpen}
              setComboboxOpen={state.setComboboxOpen}
              comboboxQuery={state.comboboxQuery}
              setComboboxQuery={state.setComboboxQuery}
              userId={state.user?.id ?? null}
            />
          )}

          <SpendingModalToggles
            showRecurringToggle={state.canToggleRecurring && !state.isGroup}
            isRecurring={state.isRecurringToggle}
            onToggleRecurring={() => state.setIsRecurringToggle((v) => !v)}
            showReceiptToggle={!isEditing}
            isReceipt={state.isReceiptToggle}
            onToggleReceipt={() => {
              // Turning the section off drops the picked file too — a hidden
              // receipt must never be silently uploaded on submit.
              if (state.isReceiptToggle) state.clearReceipt();
              state.setIsReceiptToggle(!state.isReceiptToggle);
            }}
            receiptDisabled={state.asRecurring}
            isGroup={state.isGroup}
          />

          {!state.asRecurring && state.isReceiptToggle && (
            <ReceiptField
              receiptFile={state.receiptFile}
              receiptPreview={state.receiptPreview}
              onReceiptFile={state.onReceiptFile}
              clearReceipt={state.clearReceipt}
            />
          )}

          {recurringType && (state.recurrings?.length ?? 0) === 0 && (
            <CopyRecurringsButton
              onCopy={() => {
                state.closeModal();
                state.copyRecurrings.mutate(recurringCopyDates(state.recurringMonth));
              }}
            />
          )}

          <DialogFooter className="gap-2.5 border-t border-line-soft pt-4 sm:gap-2.5">
            <Button
              type="button"
              variant="muted"
              onClick={state.closeModal}
            >
              {state.spendings.actions.cancel}
            </Button>
            <Button
              type="submit"
              data-testid="spending-submit"
              variant="primary"
              disabled={state.isSubmitting}
            >
              {state.submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SpendingModal;
